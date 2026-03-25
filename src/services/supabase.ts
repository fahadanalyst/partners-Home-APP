import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Helper to get environment variables safely
const getEnv = (key: string) => {
  const value = import.meta.env[key] || '';
  if (!value) {
    console.warn(`Supabase Service: Environment variable ${key} is missing.`);
  }
  return value;
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = () => {
  const url = getEnv('VITE_SUPABASE_URL');
  const key = getEnv('VITE_SUPABASE_ANON_KEY');

  if (!url || !key) {
    return null;
  }

  if (!supabaseInstance) {
    console.log('Supabase Service: Initializing client with URL:', url);
    try {
      supabaseInstance = createClient(url, key);
      console.log('Supabase Service: Client initialized successfully');
    } catch (err) {
      console.error('Supabase Service: Failed to initialize client:', err);
      return null;
    }
  }
  return supabaseInstance;
};

/**
 * Resets the Supabase instance. Useful on sign out to ensure a fresh client.
 */
export const resetSupabase = () => {
  supabaseInstance = null;
  console.log('Supabase Service: Client instance reset');
};

// A more robust fallback that supports chaining to prevent TypeErrors
const createFallback = (methodName: string) => {
  const fallback: any = (...args: any[]) => {
    console.warn(`Supabase Service: Called "${methodName}" but Supabase is not configured.`);
    return fallback;
  };
  
  // Add common Supabase method names to the fallback for chaining
  const chainableMethods = ['from', 'select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'like', 'ilike', 'is', 'in', 'contains', 'containedBy', 'range', 'overlaps', 'textSearch', 'match', 'not', 'or', 'filter', 'order', 'limit', 'range', 'single', 'maybeSingle', 'csv'];
  
  chainableMethods.forEach(method => {
    fallback[method] = (...args: any[]) => {
      console.warn(`Supabase Service: Chained "${method}" but Supabase is not configured.`);
      return fallback;
    };
  });

  // Make it thenable so it can be awaited
  fallback.then = (onFulfilled: any) => {
    console.error('Supabase Service: Attempted to await a Supabase operation but Supabase is not configured.');
    return Promise.resolve(onFulfilled({ data: null, error: new Error('Supabase not configured. Please check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.') }));
  };

  return fallback;
};

// Proxy for the auth object to handle dynamic initialization
const authProxy = new Proxy({} as any, {
  get: (target, prop) => {
    const client = getSupabase();
    if (client) {
      return (client.auth as any)[prop];
    }
    
    console.warn(`Supabase Service: Accessing auth.${String(prop)} but Supabase is not configured.`);
    
    // Fallback mocks for when Supabase is not yet configured
    if (prop === 'getSession') return async () => ({ data: { session: null }, error: new Error('Supabase not configured') });
    if (prop === 'onAuthStateChange') return () => ({ data: { subscription: { unsubscribe: () => {} } } });
    if (prop === 'signInWithPassword') return async () => ({ data: {}, error: new Error('Supabase not configured') });
    if (prop === 'signUp') return async () => ({ data: {}, error: new Error('Supabase not configured') });
    if (prop === 'signOut') return async () => ({ error: null });
    
    return () => {};
  }
});

// Main Supabase proxy
export const supabase = new Proxy({} as SupabaseClient, {
  get: (target, prop) => {
    if (prop === 'auth') return authProxy;
    
    const client = getSupabase();
    if (client) {
      return (client as any)[prop];
    }
    
    return createFallback(String(prop));
  }
});

/**
 * Tests the Supabase connection and checks if the required tables exist.
 */
export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  const client = getSupabase();
  
  if (!client) {
    return { 
      success: false, 
      message: 'Supabase configuration is missing. Please check your environment variables.' 
    };
  }

  try {
    // 1. Check profiles table
    const { error: profileError } = await client.from('profiles').select('id').limit(1);
    
    if (profileError) {
      console.error('Supabase profiles check error:', profileError);
      if (profileError.code === 'PGRST116' || profileError.code === '42P01') {
        return { 
          success: true, 
          message: 'Connected to Supabase, but the database schema (tables) might be missing. Please run the SQL migration.' 
        };
      }
      return { success: false, message: `Profiles table error: ${profileError.message}` };
    }

    // 2. Check forms table
    const { data: forms, error: formsError } = await client.from('forms').select('name');
    if (formsError) {
      console.error('Supabase forms check error:', formsError);
      return { success: false, message: `Forms table error: ${formsError.message}` };
    }

    const requiredForms = [
      'GAFC Progress Note',
      'GAFC Care Plan',
      'Physician Summary (PSF-1)',
      'Request for Services (RFS-1)',
      'Patient Resource Data',
      'Physician Orders',
      'MDS Assessment',
      'Nursing Assessment',
      'Medication Administration Record (MAR)',
      'Treatment Administration Record (TAR)',
      'Clinical Note'
    ];

    const existingFormNames = forms?.map(f => f.name) || [];
    const missingForms = requiredForms.filter(name => !existingFormNames.includes(name));

    if (missingForms.length > 0) {
      return { 
        success: true, 
        message: `Connected to Supabase, but ${missingForms.length} required forms are missing from the database (${missingForms.join(', ')}). Database setup is required.` 
      };
    }

    // 3. Check visits table and columns
    const { data: visitCols, error: visitsError } = await client.from('visits').select('id, location').limit(1);
    if (visitsError) {
      if (visitsError.code === '42P01') {
        return { 
          success: true, 
          message: 'Connected to Supabase, but the "visits" table is missing. Please run the SQL migration script from the Dashboard.' 
        };
      }
      if (visitsError.message.includes('location')) {
        return { 
          success: true, 
          message: 'Connected to Supabase, but the "location" column is missing from the "visits" table. Please run the SQL migration script from the Dashboard.' 
        };
      }
    }

    // 4. Check clinical_notes table and columns
    const { data: noteCols, error: notesError } = await client.from('clinical_notes').select('id, note_type').limit(1);
    if (notesError) {
      if (notesError.code === '42P01') {
        return { 
          success: true, 
          message: 'Connected to Supabase, but the "clinical_notes" table is missing. Please run the SQL migration script from the Dashboard.' 
        };
      }
      if (notesError.message.includes('note_type')) {
        return { 
          success: true, 
          message: 'Connected to Supabase, but the "note_type" column is missing from the "clinical_notes" table. Please run the SQL migration script from the Dashboard.' 
        };
      }
    }

    return { 
      success: true, 
      message: 'Successfully connected to Supabase and verified database schema.' 
    };
  } catch (err: any) {
    console.error('Unexpected error during Supabase connection test:', err);
    return { 
      success: false, 
      message: `An unexpected error occurred: ${err.message || 'Unknown error'}` 
    };
  }
};

/**
 * Seeds the database with required forms and a dummy patient if they are missing.
 * This now calls a server-side API to bypass RLS using the service role key.
 */
export const setupDatabase = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch('/api/setup-database', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to setup database');
    }

    return { 
      success: true, 
      message: result.message || 'Database setup completed successfully.' 
    };
  } catch (err: any) {
    console.error('Database setup error:', err);
    return { 
      success: false, 
      message: `Setup failed: ${err.message || 'Unknown error'}` 
    };
  }
};

// In-memory cache for form IDs to reduce database lookups and prevent timeouts
let formIdCache: Record<string, string> = {};
let isCacheInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Helper to wrap a promise with a timeout.
 */
export const withTimeout = <T>(promise: PromiseLike<T> | Promise<T>, timeoutMs: number = 90000): Promise<T> => {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs/1000} seconds`)), timeoutMs)
    )
  ]);
};

/**
 * Helper to retry a promise-returning function.
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delayMs: number = 2000
): Promise<T> => {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      console.warn(`Supabase Service: Retry ${i + 1}/${retries} failed. Retrying in ${delayMs}ms...`, err);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
};

/**
 * Performs a lightweight warm-up query to wake up the Supabase database.
 */
export const warmupSupabase = async (): Promise<void> => {
  const client = getSupabase();
  if (!client) return;

  console.log('Supabase Service: Warming up database connection...');
  try {
    // A simple query that should be fast and wake up the DB
    await withTimeout(
      client.from('forms').select('id').limit(1),
      30000 // Increased to 30s for warm-up
    );
    console.log('Supabase Service: Warm-up successful');
  } catch (err) {
    console.warn('Supabase Service: Warm-up query failed (this is usually fine if it was a cold start):', err);
  }
};

/**
 * Pre-caches all forms from the database.
 */
export const initializeFormCache = async (): Promise<void> => {
  if (isCacheInitialized) return;
  if (initializationPromise) return initializationPromise;
  
  initializationPromise = (async () => {
    const client = getSupabase();
    if (!client) return;

    try {
      // Start warm-up in background, don't wait for it
      warmupSupabase();

      console.log('Supabase Service: Initializing form cache...');
      
      const fetchData = async () => {
        console.log('Supabase Service: Fetching forms for cache...');
        const { data, error } = (await withTimeout(
          client
            .from('forms')
            .select('id, name')
            .eq('is_active', true) as any,
          20000 // 20s per attempt
        )) as any;
        
        if (error) throw error;
        return data;
      };

      // Use retry mechanism for the actual data fetch - 2 retries with 5s delay
      const data = await withRetry(fetchData, 2, 5000);
      
      if (data) {
        const newCache: Record<string, string> = {};
        data.forEach((form: any) => {
          newCache[form.name] = form.id;
        });
        formIdCache = newCache;
        isCacheInitialized = true;
        console.log('Supabase Service: Form cache initialized with', Object.keys(formIdCache).length, 'forms');
      }
    } catch (err: any) {
      console.error('Supabase Service: Failed to initialize form cache after retries:', err.message || err);
      // Don't throw here to avoid crashing the app, but log it clearly
    } finally {
      initializationPromise = null;
    }
  })();

  return initializationPromise;
};

/**
 * Returns a promise that resolves when the Supabase service is initialized.
 */
export const waitForSupabaseInitialization = async (): Promise<void> => {
  if (isCacheInitialized) return;
  if (initializationPromise) return initializationPromise;
  return initializeFormCache();
};

/**
 * Helper to get form ID by name to avoid hardcoded ID issues.
 */
export const getFormIdByName = async (name: string): Promise<string | null> => {
  const trimmedName = name.trim();
  
  // Try to initialize cache if not already done
  if (!isCacheInitialized) {
    await initializeFormCache();
  }

  // Check cache first
  if (formIdCache[trimmedName]) {
    console.log(`getFormIdByName: Cache hit for "${trimmedName}":`, formIdCache[trimmedName]);
    return formIdCache[trimmedName];
  }

  // Case-insensitive check in cache
  const caseInsensitiveKey = Object.keys(formIdCache).find(
    key => key.toLowerCase().trim() === trimmedName.toLowerCase()
  );
  if (caseInsensitiveKey) {
    console.log(`getFormIdByName: Case-insensitive cache hit for "${trimmedName}" -> "${caseInsensitiveKey}":`, formIdCache[caseInsensitiveKey]);
    return formIdCache[caseInsensitiveKey];
  }

  const client = getSupabase();
  if (!client) {
    console.error('getFormIdByName: Supabase client not available');
    return null;
  }

  console.log(`getFormIdByName: Cache miss for "${trimmedName}". Fetching from DB...`);
  try {
    // Increase timeout and add more logging
    const { data, error } = (await withTimeout(
      client
        .from('forms')
        .select('id')
        .eq('name', trimmedName)
        .limit(1)
        .maybeSingle() as any,
      60000 // Increased to 60 seconds
    )) as any;
    
    if (error) {
      console.error(`getFormIdByName: Error for "${trimmedName}":`, error);
      // Fallback to ilike immediately on error
      const { data: fallbackData } = (await withTimeout(
        client
          .from('forms')
          .select('id')
          .ilike('name', trimmedName)
          .limit(1)
          .maybeSingle() as any,
        30000 // Increased to 30s for retry
      )) as any;
      
      if (fallbackData) {
        formIdCache[trimmedName] = (fallbackData as any).id;
        return (fallbackData as any).id;
      }
      return null;
    }
    
    if (!data) {
      console.warn(`getFormIdByName: No form found with name "${trimmedName}". Retrying with case-insensitive search...`);
      const { data: retryData } = (await withTimeout(
        client
          .from('forms')
          .select('id')
          .ilike('name', trimmedName)
          .limit(1)
          .maybeSingle() as any,
        30000 // Increased to 30s for retry
      )) as any;
      
      if (retryData) {
        console.log(`getFormIdByName: Found ID for "${trimmedName}" via retry:`, (retryData as any).id);
        formIdCache[trimmedName] = (retryData as any).id;
        return (retryData as any).id;
      }

      console.warn(`getFormIdByName: No form found with name "${trimmedName}" even after retry.`);
      // Diagnostic check: list all forms and re-initialize cache
      isCacheInitialized = false;
      await initializeFormCache();
      
      if (formIdCache[trimmedName]) return formIdCache[trimmedName];
      
      return null;
    }

    console.log(`getFormIdByName: Found ID for "${trimmedName}":`, data.id);
    formIdCache[trimmedName] = data.id;
    return data.id;
  } catch (err: any) {
    console.error(`getFormIdByName: Unexpected error for "${trimmedName}":`, err.message || err);
    return null;
  }
};

/**
 * Helper to wrap a promise with a timeout.
 * (Moved to top of file)
 */

export type UserRole = 'admin' | 'manager' | 'frontdesk' | 'care_manager' | 'reviewer' | 'nurse';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  dob: string;
  gender: string;
  phone: string;
  email: string;
  insurance_id: string;
}

export interface Visit {
  id: string;
  patient_id: string;
  staff_id: string;
  scheduled_at: string;
  start_time: string;
  end_time: string;
  status: 'Open' | 'Assigned' | 'Canceled' | 'Verified';
  location: string;
  notes?: string;
  patient: Patient;
  staff: Profile;
}

export interface ProgressNote {
  id?: string;
  participantName: string;
  dob: string;
  gafcProvider: string;
  visitDate: string;
  visitTime: string;
  location: string;
  staffNameTitle: string;
  reasonForVisit: string;
  subjective: any;
  objective: any;
  environmentSafety: any;
  medicationReview: any;
  adls: any;
  assessment: string;
  interventions: string[];
  education: string;
  plan: any;
  staffSignature: string;
  signatureDate: string;
  created_at?: string;
}

export interface CarePlan {
  id?: string;
  memberInfo: any;
  emergencyContact: any;
  primaryCareProvider: any;
  dates: any;
  eligibility: any;
  medicalConditions: string;
  functionalAssessment: any;
  goals: any;
  identifiedNeeds: any;
  interventions: any[];
  riskAssessment: any;
  memberStrengths: string[];
  memberStrengthsOther: string;
  memberPreferences: any;
  monthlyReview: any;
  signatures: any;
  created_at?: string;
}