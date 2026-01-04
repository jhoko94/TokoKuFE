/**
 * Helper functions untuk normalize data dari API
 * Mengkonversi object (dari lookup tables) menjadi string untuk backward compatibility
 */

/**
 * Normalize user object - extract role code jika role adalah object
 */
export const normalizeUser = (user) => {
  if (!user) return null;
  
  // Jika role adalah object, extract code untuk backward compatibility
  if (user.role && typeof user.role === 'object' && user.role.code) {
    return {
      ...user,
      role: user.role.code, // String code untuk backward compatibility
      roleObject: user.role, // Simpan object lengkap jika diperlukan
    };
  }
  
  return user;
};

/**
 * Normalize customer object - extract type code jika type adalah object
 */
export const normalizeCustomer = (customer) => {
  if (!customer) return null;
  
  if (customer.type && typeof customer.type === 'object' && customer.type.code) {
    return {
      ...customer,
      type: customer.type.code, // String code untuk backward compatibility
      typeObject: customer.type, // Simpan object lengkap jika diperlukan
      canBon: customer.type.canBon, // Extract canBon untuk validasi
    };
  }
  
  return customer;
};

/**
 * Normalize transaction object - extract type code jika type adalah object
 */
export const normalizeTransaction = (transaction) => {
  if (!transaction) return null;
  
  if (transaction.type && typeof transaction.type === 'object' && transaction.type.code) {
    return {
      ...transaction,
      type: transaction.type.code, // String code untuk backward compatibility
      typeObject: transaction.type, // Simpan object lengkap jika diperlukan
    };
  }
  
  return transaction;
};

/**
 * Normalize array of customers
 */
export const normalizeCustomers = (customers) => {
  if (!Array.isArray(customers)) return [];
  return customers.map(normalizeCustomer);
};

/**
 * Normalize array of transactions
 */
export const normalizeTransactions = (transactions) => {
  if (!Array.isArray(transactions)) return [];
  return transactions.map(normalizeTransaction);
};

/**
 * Get role code from user (handle both object and string)
 */
export const getUserRole = (user) => {
  if (!user || !user.role) return null;
  return typeof user.role === 'object' ? user.role.code : user.role;
};

/**
 * Get customer type code (handle both object and string)
 */
export const getCustomerType = (customer) => {
  if (!customer || !customer.type) return null;
  return typeof customer.type === 'object' ? customer.type.code : customer.type;
};

/**
 * Get transaction type code (handle both object and string)
 */
export const getTransactionType = (transaction) => {
  if (!transaction || !transaction.type) return null;
  return typeof transaction.type === 'object' ? transaction.type.code : transaction.type;
};

/**
 * Check if customer can do BON transaction
 */
export const canCustomerBon = (customer) => {
  if (!customer) return false;
  
  // Jika type adalah object, gunakan canBon property
  if (customer.type && typeof customer.type === 'object') {
    return customer.type.canBon === true;
  }
  
  // Jika type adalah string, cek apakah bukan UMUM
  return customer.type !== 'UMUM';
};

