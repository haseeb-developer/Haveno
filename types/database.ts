/**
 * Placeholder for Supabase generated database types.
 *
 * Once you run `supabase gen types typescript`, this file can be replaced
 * wholesale — these types are hand-written to match the schema in
 * supabase/migrations exactly, so typed Supabase queries work correctly
 * against vault_encryption_keys and vault_items in the meantime.
 *
 * NOTE: these are declared with `type`, not `interface`. supabase-js's
 * generic Database constraint resolution doesn't correctly infer Row
 * types through named `interface` declarations in this version — using
 * `type` avoids that and keeps `.from(...)` fully typed.
 */

export type VaultEncryptionKeyDbRow = {
  user_id: string;
  wrapped_dek: string;
  wrap_iv: string;
  kdf_salt: string;
  kdf_algorithm: string;
  kdf_params: {
    memorySize: number;
    iterations: number;
    parallelism: number;
    hashLength: number;
  };
  verifier: string;
  verifier_iv: string;
  encryption_version: number;
  created_at: string;
  updated_at: string;
};

export type VaultItemDbRow = {
  id: string;
  user_id: string;
  encrypted_payload: string;
  iv: string;
  encryption_version: number;
  created_at: string;
  updated_at: string;
};

export type ProfileDbRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  terms_acknowledged_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      vault_encryption_keys: {
        Row: VaultEncryptionKeyDbRow;
        Insert: Omit<VaultEncryptionKeyDbRow, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<VaultEncryptionKeyDbRow>;
        Relationships: [];
      };
      vault_items: {
        Row: VaultItemDbRow;
        Insert: Omit<
          VaultItemDbRow,
          "id" | "created_at" | "updated_at"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<VaultItemDbRow>;
        Relationships: [];
      };
      profiles: {
        Row: ProfileDbRow;
        Insert: Omit<ProfileDbRow, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<ProfileDbRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
