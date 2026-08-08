export interface VaultItemPlaintext {
  name: string;
  username: string;
  password: string;
  hint: string;
  url: string;
  category: string;
  isFavorite: boolean;
}

/** A vault item as decrypted and held in memory for the unlocked session. */
export interface VaultItem extends VaultItemPlaintext {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/** Row shape as it actually exists in Supabase — ciphertext only. */
export interface VaultItemRow {
  id: string;
  user_id: string;
  encrypted_payload: string;
  iv: string;
  encryption_version: number;
  created_at: string;
  updated_at: string;
}

export interface VaultEncryptionKeyRow {
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
}

export type VaultLockStatus =
  | "checking"
  | "needs-setup"
  | "locked"
  | "unlocked";

export type VaultItemInput = Omit<VaultItemPlaintext, "isFavorite"> & {
  isFavorite?: boolean;
};
