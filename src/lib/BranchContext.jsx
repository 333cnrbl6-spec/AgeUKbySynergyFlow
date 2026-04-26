import React, { createContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export const BranchContext = createContext();

export const BranchProvider = ({ children }) => {
  const [currentBranch, setCurrentBranch] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initBranch = async () => {
      try {
        const user = await base44.auth.me();
        
        // Validate user has branch assignment
        if (!user?.branch_id) {
          throw new Error('User has no branch assigned. Contact your administrator.');
        }

        setCurrentBranch(user.branch_id);
        
        // Fetch available branches for branch switching (admins/managers only)
        if (user?.role === 'admin' || user?.role === 'manager') {
          const allBranches = await base44.entities.Branch.filter({ branch_id: user.branch_id });
          setBranches(allBranches || []);
        }
      } catch (err) {
        const msg = err?.message || 'Failed to initialize branch context';
        console.error('[BranchContext]', msg, err);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    initBranch();
  }, []);

  const switchBranch = (branchId) => {
    if (!branchId || typeof branchId !== 'string') {
      console.warn('[BranchContext] Invalid branch ID:', branchId);
      return;
    }
    setCurrentBranch(branchId);
    // Persist to sessionStorage (not localStorage for security)
    sessionStorage.setItem('selectedBranch', branchId);
  };

  const value = {
    currentBranch: currentBranch || null,
    branches: branches || [],
    loading,
    error,
    switchBranch,
    isInitialized: !loading && currentBranch !== null
  };

  return (
    <BranchContext.Provider value={value}>
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => {
  const context = React.useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within BranchProvider');
  }
  
  // Warn if branch not initialized or has errors
  if (context.error) {
    console.error('[useBranch] Context error:', context.error);
  }
  
  return context;
};