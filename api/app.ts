import "dotenv/config";
import express from "express";
import cors from "cors";
import { jsPDF } from "jspdf";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("CRITICAL: Supabase environment variables are missing!");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const app = express();
app.use(cors());
app.use(express.json());

// Admin: Create User Endpoint
app.post("/api/admin/create-user", async (req, res) => {
    try {
      const { email, password, fullName, role } = req.body;
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName }
      });
      if (authError) throw authError;
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ role, full_name: fullName })
        .eq('id', authData.user.id);
      if (profileError) throw profileError;
      res.json({ success: true, user: authData.user });
    } catch (error: any) {
      console.error("Admin Create User Error:", error);
      res.status(500).json({ error: error.message });
    }
});

// Admin: Delete User Endpoint
app.post("/api/admin/delete-user", async (req, res) => {
    try {
      const { userId } = req.body;
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authError) {
        const isUserNotFound = authError.message?.toLowerCase().includes('not found') || 
                              (authError as any).status === 404;
        if (isUserNotFound) {
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', userId);
          if (profileError) throw profileError;
        } else {
          throw authError;
        }
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Admin Delete User Error:", error);
      res.status(500).json({ error: error.message });
    }
});

// Database Setup Endpoint
app.post("/api/setup-database", async (req, res) => {
    try {
      const formsToSeed = [
        { name: 'GAFC Progress Note', description: 'Monthly GAFC clinical progress note', schema: {} },
        { name: 'GAFC Care Plan', description: 'MassHealth GAFC Program Care Plan', schema: {} },
        { name: 'Physician Summary (PSF-1)', description: 'Physician summary for GAFC services', schema: {} },
        { name: 'Request for Services (RFS-1)', description: 'Request for GAFC services', schema: {} },
        { name: 'Patient Resource Data', description: 'Patient demographic and resource information', schema: {} },
        { name: 'Physician Orders', description: 'Physician orders for clinical care', schema: {} },
        { name: 'MDS Assessment', description: 'Minimum Data Set assessment', schema: {} },
        { name: 'Nursing Assessment', description: 'Comprehensive nursing assessment', schema: {} },
        { name: 'Medication Administration Record (MAR)', description: 'Monthly MAR tracking', schema: {} },
        { name: 'Treatment Administration Record (TAR)', description: 'Monthly TAR tracking', schema: {} },
        { name: 'Clinical Note', description: 'General clinical documentation', schema: {} },
        { name: 'Admission Assessment', description: 'Initial patient admission evaluation', schema: {} },
        { name: 'Discharge Summary', description: 'Final documentation upon patient discharge', schema: {} }
      ];
      for (const form of formsToSeed) {
        const { data: existingForm } = await supabaseAdmin
          .from('forms')
          .select('id')
          .eq('name', form.name)
          .maybeSingle();
        if (!existingForm) {
          await supabaseAdmin.from('forms').insert([form]);
        }
      }
      const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
      if (!usersError && users?.users) {
        const allUsers = [...users.users];
        if (allUsers.length === 0) {
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: 'kianiisrarazam@gmail.com',
            password: 'Password123!',
            email_confirm: true,
            user_metadata: { full_name: 'Israr Azam Kiani' }
          });
          if (!createError && newUser?.user) {
            allUsers.push(newUser.user);
          }
        }
        for (const user of allUsers) {
          const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();
          if (!existingProfile) {
            await supabaseAdmin.from('profiles').insert([{
              id: user.id,
              full_name: user.user_metadata?.full_name || user.email,
              email: user.email,
              role: 'admin'
            }]);
          }
        }
      }
      res.json({ success: true, message: 'Database setup completed successfully.' });
    } catch (error: any) {
      console.error("Server: Database Setup Error:", error);
      res.status(500).json({ error: error.message });
    }
});

// Patient: Create Endpoint (Bypasses RLS)
app.post("/api/patients/create", async (req, res) => {
    try {
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("Supabase environment variables (VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY) are missing on the server.");
      }
      const { data, error } = await supabaseAdmin
        .from('patients')
        .insert([req.body])
        .select();
      if (error) throw error;
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("Server: Patient Create Error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
});

// Patient: Update Endpoint (Bypasses RLS)
app.post("/api/patients/update", async (req, res) => {
    try {
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("Supabase environment variables (VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY) are missing on the server.");
      }
      const { id, ...patientData } = req.body;
      const { data, error } = await supabaseAdmin
        .from('patients')
        .update(patientData)
        .eq('id', id)
        .select();
      if (error) throw error;
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("Server: Patient Update Error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
});

// Patient: Delete Endpoint (Bypasses RLS and handles cleanup)
app.post("/api/patients/delete", async (req, res) => {
    try {
      const { id } = req.body;
      if (!id) throw new Error("Patient ID is required");

      console.log(`Server: Deleting patient ${id} and all related records...`);

      // 1. Delete signatures related to this patient's forms and notes
      const { data: forms } = await supabaseAdmin.from('form_responses').select('id').eq('patient_id', id);
      const { data: notes } = await supabaseAdmin.from('clinical_notes').select('id').eq('patient_id', id);
      
      const formIds = forms?.map(f => f.id) || [];
      const noteIds = notes?.map(n => n.id) || [];
      const allParentIds = [...formIds, ...noteIds];

      if (allParentIds.length > 0) {
        await supabaseAdmin.from('signatures').delete().in('parent_id', allParentIds);
      }

      // 2. Delete other related records
      await supabaseAdmin.from('form_responses').delete().eq('patient_id', id);
      await supabaseAdmin.from('clinical_notes').delete().eq('patient_id', id);
      await supabaseAdmin.from('visits').delete().eq('patient_id', id);
      await supabaseAdmin.from('files').delete().eq('patient_id', id);

      // 3. Finally delete the patient
      const { error } = await supabaseAdmin.from('patients').delete().eq('id', id);

      if (error) throw error;
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Server: Patient Delete Error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
});

app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/api/generate-pdf", async (req, res) => {
    try {
      const { title, data, signatures } = req.body;
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text(title || "Clinical Document", 20, 20);
      doc.setFontSize(12);
      let y = 40;
      Object.entries(data || {}).forEach(([key, value]) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(`${key}: ${value}`, 20, y);
        y += 10;
      });
      if (signatures && signatures.length > 0) {
        y += 20;
        signatures.forEach((sig: any) => {
          if (y > 250) {
            doc.addPage();
            y = 20;
          }
          doc.text(`Signed by: ${sig.signer_name}`, 20, y);
          y += 5;
          if (sig.image) {
            doc.addImage(sig.image, 'PNG', 20, y, 50, 20);
            y += 25;
          }
        });
      }
      const pdfBuffer = doc.output('arraybuffer');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=document.pdf');
      res.send(Buffer.from(pdfBuffer));
    } catch (error) {
      console.error("PDF Generation Error:", error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
});

app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route ${req.method} ${req.url} not found` });
});

export default app;
