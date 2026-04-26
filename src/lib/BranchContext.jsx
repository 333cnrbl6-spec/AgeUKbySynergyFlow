import React, { createContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export const BranchContext = createContext();

export const BranchProvider = ({ children }) => {
  const [currentBranch, setCurrentBranch] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initBranch = async () => {
      try {
        const user = await base44.auth.me();
        if (user?.branch_id) {
          setCurrentBranch(user.branch_id);
        }
        // Fetch available branches for admins/managers
        const allBranches = await base44.entities.Branch.list();
        setBranches(allBranches);
      } catch (error) {
        console.error('Branch initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initBranch();
  }, []);

  const switchBranch = (branchId) => {
    setCurrentBranch(branchId);
    // Save to localStorage for persistence
    localStorage.setItem('selectedBranch', branchId);
  };

  const value = {
    currentBranch,
    branches,
    loading,
    switchBranch
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
  return context;
};