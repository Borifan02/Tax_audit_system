import React, { useState, useEffect } from 'react';
import Card from '../Card';
import Badge from '../Badge';
import { useData } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';

function CascadePlanToCasesView() {
  const { getUserInfo } = useAuth();
  const { data, updateData } = useData();
  const userInfo = getUserInfo();
  
  // Auto-populate from login context - use org_context which is set during login
  const userRegion = userInfo?.orgContext?.assignedRegion || null;
  const userTaxCenter = userInfo?.orgContext?.assignedTaxCenter || null;
  
  const [selectedRegion, setSelectedRegion] = useState(userRegion);
  const [selectedTaxCenter, setSelectedTaxCenter] = useState(userTaxCenter);
  const [selectedPlan, setSelectedPlan] = useState(null);
  
  // DEBUG: Log what we got from auth
  useEffect(() => {
    console.log('🔐 CascadePlanToCasesView - User Context:', {
      userInfo: userInfo?.fullName,
      userRole: userInfo?.role,
      assignedRegion: userInfo?.orgContext?.assignedRegion,
      assignedTaxCenter: userInfo?.orgContext?.assignedTaxCenter
    });
  }, [userInfo]);
  
  const [allPlans, setAllPlans] = useState([]);
  const [approvedPlan, setApprovedPlan] = useState(null);
  const [taxCenterAllocation, setTaxCenterAllocation] = useState(null);
  const [allTaxpayers, setAllTaxpayers] = useState([]);
  const [selectedTaxpayers, setSelectedTaxpayers] = useState(new Map());
  const [filteredTaxpayers, setFilteredTaxpayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRiskLevel, setFilterRiskLevel] = useState('All');
  const [filterAuditType, setFilterAuditType] = useState('All');
  const [cascadedCases, setCascadedCases] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [remainingAllocations, setRemainingAllocations] = useState({});
  const itemsPerPage = 15;

  // Normalize tax center name function
  const normalizeTaxCenterName = (taxCenter, region) => {
    if (!taxCenter) return null;
    if (taxCenter.includes('Tax Center')) {
      const parts = taxCenter.split(' ');
      const tcNum = parts[parts.length - 1];
      return `${region}-tc${tcNum}`;
    }
    return taxCenter;
  };

  // Load ACCEPTED plans - REAL DATA ONLY
  useEffect(() => {
    // Using data from hook
    let acceptedPlans = [];
    
    if (!selectedRegion || !selectedTaxCenter) {
      console.warn('⚠️ No region or tax center selected');
      setAllPlans([]);
      return;
    }

    const normalizedTC = normalizeTaxCenterName(selectedTaxCenter, selectedRegion);
    
    // Filter: Plans accepted by THIS tax center
    acceptedPlans = (data.plans || []).filter(p => {
      // MUST have taxCenterAcceptance entry for this region and tax center
      const acceptance = p.taxCenterAcceptance?.[selectedRegion]?.[normalizedTC];
      if (!acceptance) return false;
      
      // MUST have status ACCEPTED
      if (acceptance.status !== 'ACCEPTED') return false;
      
      return true;
    });

    setAllPlans(acceptedPlans);
    const cases = data.auditCases || [];
    setCascadedCases(cases);

    console.log('✅ CASCADE VIEW - Plans Loaded:', {
      region: selectedRegion,
      taxCenter: selectedTaxCenter,
      normalizedTC,
      totalAcceptedPlans: acceptedPlans.length,
      plans: acceptedPlans.map(p => ({
        id: p.id,
        status: p.status,
        fiscalYear: p.fiscalYear,
        acceptedDate: p.taxCenterAcceptance?.[selectedRegion]?.[normalizedTC]?.acceptedDate
      }))
    });
  }, [selectedRegion, selectedTaxCenter]);

  // Helper: Map audit type name to key
  const getAuditTypeKey = (auditTypeName) => {
    const mapping = {
      'Desk Audit': 'desk_audit',
      'Field Audit': 'field_audit',
      'Joint Audit': 'joint_audit',
      'Transfer Pricing': 'transfer_pricing',
      'Comprehensive': 'comprehensive',
      'Single Issue': 'issue_audit'
    };
    return mapping[auditTypeName] || '';
  };

  // Helper: Map key to audit type name
  const getAuditTypeName = (key) => {
    const mapping = {
      'desk_audit': 'Desk Audit',
      'field_audit': 'Field Audit',
      'joint_audit': 'Joint Audit',
      'transfer_pricing': 'Transfer Pricing',
      'comprehensive': 'Comprehensive',
      'issue_audit': 'Single Issue'
    };
    return mapping[key] || '';
  };

  // Store tax center selection whenever it changes (for AuditCasesListView to find cases)
  useEffect(() => {
    if (selectedTaxCenter && selectedRegion) {
      localStorage.setItem('tax_center_selection', selectedTaxCenter);
      localStorage.setItem('tax_center_selection_region', selectedRegion);
      console.log('📍 Tax Center Selection Stored in Cascade View:', { selectedTaxCenter, selectedRegion });
    }
  }, [selectedTaxCenter, selectedRegion]);

  // Load allocation when plan/tax center selected
  useEffect(() => {
    if (selectedRegion && selectedTaxCenter && selectedPlan) {
      const plan = allPlans.find(p => p.id === selectedPlan);
      if (plan) {
        setApprovedPlan(plan);
        
        console.log('=== ALLOCATION LOOKUP START ===');
        console.log('Plan structure:', {
          planId: plan.id,
          hasRegionalAllocation: !!plan.regionalAllocation,
          regionalAllocationKeys: plan.regionalAllocation ? Object.keys(plan.regionalAllocation) : [],
          hasTaxCenterAllocations: !!plan.taxCenterAllocations,
          taxCenterAllocationKeys: plan.taxCenterAllocations ? Object.keys(plan.taxCenterAllocations) : [],
          selectedRegion,
          selectedTaxCenter
        });

        // CRITICAL: Look for allocation in regionalAllocation (regional view format)
        // This is the allocation sent from Director to Regional Director
        const regionalAlloc = plan.regionalAllocation?.[selectedRegion];
        
        console.log('Regional allocation lookup:', {
          path: `plan.regionalAllocation['${selectedRegion}']`,
          found: !!regionalAlloc,
          value: regionalAlloc
        });

        // FALLBACK: Look in taxCenterAllocations (old format)
        let taxCenterKey = selectedTaxCenter;
        let allocation = plan.taxCenterAllocations?.[selectedRegion]?.[selectedTaxCenter];
        
        // If not found, try the format "Region-tc#"
        if (!allocation) {
          const parts = selectedTaxCenter.split(' ');
          const tcNum = parts[parts.length - 1];
          taxCenterKey = `${selectedRegion}-tc${tcNum}`;
          allocation = plan.taxCenterAllocations?.[selectedRegion]?.[taxCenterKey];
        }

        console.log('Tax center allocation lookup:', {
          path: `plan.taxCenterAllocations['${selectedRegion}']['${taxCenterKey}']`,
          found: !!allocation,
          value: allocation
        });

        console.log('=== ALLOCATION LOOKUP END ===');
        
        // IMPORTANT: Use whichever one is found - prefer taxCenterAllocations if available
        // but accept regionalAllocation as fallback
        const finalAllocation = allocation || regionalAlloc;
        setTaxCenterAllocation(finalAllocation);
        
        // Debug: Log allocation info
        console.log('📋 Final Allocation loaded:', {
          plan: selectedPlan,
          region: selectedRegion,
          taxCenter: selectedTaxCenter,
          allocationType: allocation ? 'taxCenterAllocations' : (regionalAlloc ? 'regionalAllocation' : 'NONE'),
          allocation: finalAllocation
        });
        
        // Calculate remaining allocations - per THIS specific tax center
        const remaining = {};
        const auditTypes = ['desk_audit', 'field_audit', 'joint_audit', 'transfer_pricing', 'comprehensive', 'issue_audit'];
        auditTypes.forEach(type => {
          const total = finalAllocation?.[type] || 0;
          // Count cascaded cases ONLY for this tax center
          const cascaded = cascadedCases.filter(c => 
            c.taxCenter === selectedTaxCenter && 
            c.region === selectedRegion && 
            c.planId === selectedPlan &&
            c.auditType === getAuditTypeName(type)
          ).length;
          remaining[type] = Math.max(0, total - cascaded);
        });
        setRemainingAllocations(remaining);
        
        generateTaxpayerList();
        setCurrentPage(1);
      }
    }
  }, [selectedRegion, selectedTaxCenter, selectedPlan, allPlans, cascadedCases]);

  // Apply filters
  useEffect(() => {
    let filtered = allTaxpayers;
    if (searchTerm) {
      filtered = filtered.filter(tp => 
        tp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tp.tin.includes(searchTerm)
      );
    }
    if (filterRiskLevel !== 'All') {
      filtered = filtered.filter(tp => tp.riskLevel === filterRiskLevel);
    }
    if (filterAuditType !== 'All') {
      filtered = filtered.filter(tp => tp.recommendedAuditType === filterAuditType);
    }
    setFilteredTaxpayers(filtered);
    setCurrentPage(1);
  }, [searchTerm, filterRiskLevel, filterAuditType, allTaxpayers]);

  // Generate taxpayers
  const generateTaxpayerList = () => {
    const taxpayers = [];
    const riskLevels = ['Critical', 'High', 'Medium', 'Low'];
    const industries = ['Construction', 'Manufacturing', 'Wholesale', 'Services', 'Import/Export', 'Agriculture'];
    const businessNames = ['Trading PLC', 'Manufacturing Ltd', 'Wholesale Co', 'Services Inc', 'Import House', 'Agriculture Ltd'];
    const auditTypeRecommendations = {
      'Critical': 'Comprehensive',
      'High': 'Field Audit',
      'Medium': 'Desk Audit',
      'Low': 'Desk Audit'
    };

    for (let i = 1; i <= 410; i++) {
      const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
      const riskScore = riskLevel === 'Critical' ? Math.round(80 + Math.random() * 20) : 
                       riskLevel === 'High' ? Math.round(65 + Math.random() * 15) :
                       riskLevel === 'Medium' ? Math.round(45 + Math.random() * 20) :
                       Math.round(20 + Math.random() * 25);
      const recommendedType = auditTypeRecommendations[riskLevel];
      const estimatedHours = riskLevel === 'Critical' ? Math.round(180 + Math.random() * 60) :
                            riskLevel === 'High' ? Math.round(120 + Math.random() * 60) :
                            riskLevel === 'Medium' ? Math.round(80 + Math.random() * 40) :
                            Math.round(40 + Math.random() * 40);

      taxpayers.push({
        id: `TP-${String(i).padStart(4, '0')}`,
        tin: `ET${String(1000000 + i).padStart(6, '0')}`,
        name: `${['Solomon', 'Selam', 'Abebe', 'Medhin', 'Tigist', 'Dawit', 'Almaz'][Math.floor(Math.random() * 7)]} ${businessNames[Math.floor(Math.random() * businessNames.length)]}`,
        industry: industries[Math.floor(Math.random() * industries.length)],
        riskScore,
        riskLevel,
        revenueAtRisk: Math.round(500000 + Math.random() * 4500000),
        recommendedAuditType: recommendedType,
        estimatedHours
      });
    }
    setAllTaxpayers(taxpayers);
    setFilteredTaxpayers(taxpayers);
  };

  // Toggle selection with validation
  const toggleTaxpayerSelection = (taxpayerId) => {
    const taxpayer = allTaxpayers.find(tp => tp.id === taxpayerId);
    if (!taxpayer) return;
    
    const auditType = taxpayer.recommendedAuditType;
    const key = `${taxpayerId}-${auditType}`;
    const auditTypeKey = getAuditTypeKey(auditType);
    const remainingSlots = remainingAllocations[auditTypeKey] || 0;
    
    const newSelected = new Map(selectedTaxpayers);
    
    // If trying to add and no slots remaining
    if (!newSelected.has(key)) {
      if (remainingSlots <= 0) {
        alert(`❌ No available slots for ${auditType}\n\nAllocated: ${taxCenterAllocation?.[auditTypeKey] || 0}\nAlready cascaded: ${(taxCenterAllocation?.[auditTypeKey] || 0) - remainingSlots}\nRemaining: 0`);
        return;
      }
      // Add the selection
      newSelected.set(key, { taxpayerId, auditType });
    } else {
      // Remove the selection
      newSelected.delete(key);
    }
    setSelectedTaxpayers(newSelected);
  };

  // Auto-cascade - fill remaining slots by audit type
  const handleAutoCascade = () => {
    const newSelected = new Map(selectedTaxpayers);
    let casesAdded = 0;

    const auditTypeMapping = {
      'Comprehensive': 'comprehensive',
      'Field Audit': 'field_audit',
      'Joint Audit': 'joint_audit',
      'Desk Audit': 'desk_audit',
      'Transfer Pricing': 'transfer_pricing',
      'Single Issue': 'issue_audit'
    };

    // For each audit type, fill up to remaining slots
    Object.entries(auditTypeMapping).forEach(([typeName, typeKey]) => {
      let currentRemaining = remainingAllocations[typeKey] || 0;
      
      // Count already selected for this type
      let alreadySelectedForType = 0;
      newSelected.forEach(selection => {
        if (selection.auditType === typeName) {
          alreadySelectedForType++;
        }
      });
      
      // Calculate slots still available for this type
      const slotsAvailable = currentRemaining - alreadySelectedForType;
      let filled = 0;

      if (slotsAvailable > 0) {
        filteredTaxpayers.forEach(taxpayer => {
          if (filled >= slotsAvailable) return;
          if (taxpayer.recommendedAuditType === typeName) {
            const key = `${taxpayer.id}-${typeName}`;
            if (!newSelected.has(key)) {
              newSelected.set(key, { taxpayerId: taxpayer.id, auditType: typeName });
              filled++;
              casesAdded++;
            }
          }
        });
      }
    });

    setSelectedTaxpayers(newSelected);
    alert(`✓ Auto-cascaded ${casesAdded} taxpayers\n\nTotal selected: ${newSelected.size} cases`);
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedTaxpayers(new Map());
  };

  // Create cases - WITH DUPLICATE PREVENTION
  const handleCreateCases = () => {
    if (!selectedPlan) {
      alert('❌ Please select a plan first');
      return;
    }

    if (selectedTaxpayers.size === 0) {
      alert('❌ Please select at least one taxpayer');
      return;
    }

    // Using data from hook
    
    // VALIDATION 1: Check if cases already created for this plan from this cascade
    const existingCasesForPlan = (data.auditCases || []).filter(c => 
      c.planId === selectedPlan && 
      c.region === selectedRegion && 
      c.taxCenter === selectedTaxCenter
    );

    if (existingCasesForPlan.length > 0) {
      const proceed = window.confirm(
        `Notice: This plan already has ${existingCasesForPlan.length} case(s) created for ${selectedTaxCenter}.\n\nDo you want to proceed and create/add these selected cases?`
      );
      if (!proceed) {
        return;
      }
    }

    // VALIDATION 2: Check allocation limits per audit type
    const byAuditType = {};
    selectedTaxpayers.forEach(selection => {
      if (!byAuditType[selection.auditType]) {
        byAuditType[selection.auditType] = 0;
      }
      byAuditType[selection.auditType]++;
    });

    // Validate each audit type
    for (const [auditType, count] of Object.entries(byAuditType)) {
      const auditTypeKey = getAuditTypeKey(auditType);
      const allocated = taxCenterAllocation?.[auditTypeKey] || 0;
      
      if (count > allocated) {
        alert(`❌ ERROR: ${auditType} exceeds allocation\n\nSelected: ${count}\nAllocated: ${allocated}`);
        return;
      }
    }

    // VALIDATION 3: Check for duplicate taxpayer selections (same taxpayer twice)
    const taxpayerIds = new Set();
    let duplicateFound = false;
    selectedTaxpayers.forEach(selection => {
      if (taxpayerIds.has(selection.taxpayerId)) {
        duplicateFound = true;
      }
      taxpayerIds.add(selection.taxpayerId);
    });

    if (duplicateFound) {
      alert('❌ ERROR: Same taxpayer selected multiple times. Each taxpayer can only be selected once.');
      return;
    }

    // All validations passed - CREATE CASES
    const newCases = Array.from(selectedTaxpayers.values()).map((selection, idx) => {
      const taxpayer = allTaxpayers.find(tp => tp.id === selection.taxpayerId);
      
      if (!taxpayer) {
        console.error('Taxpayer not found:', selection.taxpayerId);
        return null;
      }

      return {
        id: `CASE-${selectedRegion}-${selectedTaxCenter}-${Date.now()}-${idx}`,
        planId: selectedPlan,                    // ← Links to plan
        taxCenter: selectedTaxCenter,
        region: selectedRegion,
        
        taxpayerId: selection.taxpayerId,
        taxpayerName: taxpayer.name,
        tin: taxpayer.tin,
        industry: taxpayer.industry,
        
        riskLevel: taxpayer.riskLevel,
        riskScore: taxpayer.riskScore,
        revenueAtRisk: taxpayer.revenueAtRisk,
        
        auditType: selection.auditType,
        estimatedHours: taxpayer.estimatedHours,
        
        status: 'PENDING_PROCESS_OWNER',        // ← Routed to Process Owner
        createdDate: new Date().toISOString(),
        createdFrom: 'CASCADE_PLAN',            // ← Track origin
        
        assignedTeam: null,
        leadAuditor: null,
        
        // Prioritization fields (will be set later)
        storageStatus: undefined,
        priorityRank: undefined
      };
    }).filter(c => c !== null);

    if (newCases.length === 0) {
      alert('❌ ERROR: No valid cases created');
      return;
    }

    // SAVE: Add to data and persist
    data.auditCases = [...(data.auditCases || []), ...newCases];
    updateData(data);
    
    // Update state
    setCascadedCases([...cascadedCases, ...newCases]);
    setSelectedTaxpayers(new Map());
    
    // Confirm to user
    alert(`✅ SUCCESS: Created ${newCases.length} audit cases\n\nPlan: ${selectedPlan}\nTax Center: ${selectedTaxCenter}\nRegion: ${selectedRegion}\n\nCases are now ready for prioritization.`);
  };

  // Get allocation summary
  const getAllocationSummary = () => {
    if (!taxCenterAllocation) return {};
    const summary = {};
    const types = {
      'desk_audit': 'Desk Audit',
      'field_audit': 'Field Audit',
      'joint_audit': 'Joint Audit',
      'transfer_pricing': 'Transfer Pricing',
      'comprehensive': 'Comprehensive',
      'issue_audit': 'Single Issue'
    };
    
    Object.entries(types).forEach(([key, name]) => {
      summary[name] = {
        total: taxCenterAllocation[key] || 0,
        remaining: remainingAllocations[key] || 0,
        cascaded: (taxCenterAllocation[key] || 0) - (remainingAllocations[key] || 0)
      };
    });
    return summary;
  };

  // Get selection summary
  const getSelectionSummary = () => {
    const selected = Array.from(selectedTaxpayers.values());
    let totalRevenue = 0;
    let totalHours = 0;
    
    selected.forEach(selection => {
      const taxpayer = allTaxpayers.find(tp => tp.id === selection.taxpayerId);
      if (taxpayer) {
        totalRevenue += taxpayer.revenueAtRisk;
        totalHours += taxpayer.estimatedHours;
      }
    });
    
    return { count: selected.length, totalRevenue, totalHours };
  };

  const paginatedTaxpayers = filteredTaxpayers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredTaxpayers.length / itemsPerPage);
  const allocationSummary = getAllocationSummary();
  const selectionSummary = getSelectionSummary();
  const totalAllocated = Object.values(remainingAllocations).reduce((a, b) => a + b, 0);
  
  // Selection screen
  if (!selectedPlan || allPlans.length === 0) {
    return (
      <div className="p-8">
        <h2 className="mb-8"><i className="fas fa-tasks"></i> Cascade Plan to Audit Cases</h2>
        
        {/* Display auto-assigned region and tax center */}
        {selectedRegion && selectedTaxCenter && (
          <div className="bg-panel dark:bg-panel-dark p-4 rounded-lg mb-8 border border-border dark:border-border-dark">
            <p className="text-xs text-text-mid dark:text-text-mid mb-3 font-bold">📌 YOUR ASSIGNED LOCATION</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-ink dark:bg-ink p-3 rounded-md border border-border dark:border-border-dark">
                <p className="text-xs text-text-mid dark:text-text-mid mb-1">REGION</p>
                <p className="text-sm font-bold text-blue dark:text-blue">{selectedRegion}</p>
              </div>
              <div className="bg-ink dark:bg-ink p-3 rounded-md border border-border dark:border-border-dark">
                <p className="text-xs text-text-mid dark:text-text-mid mb-1">TAX CENTER</p>
                <p className="text-sm font-bold text-gold dark:text-gold">{selectedTaxCenter}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Plan selector - SHOW ALL PLANS */}
        <div className="flex gap-3 mb-8 flex-wrap items-start">
          <div className="flex-1 min-w-[250px]">
            <label className="text-xs text-text-mid dark:text-text-mid font-bold block mb-2">SELECT APPROVED PLAN TO CASCADE</label>
            <select value={selectedPlan || ''} onChange={(e) => setSelectedPlan(e.target.value || null)}
              className="w-full px-3 py-2 border-2 border-blue dark:border-blue rounded-lg bg-panel dark:bg-panel-dark text-text-hi dark:text-text-hi text-sm font-medium focus:outline-none focus:border-blue dark:focus:border-blue">
              <option value="">-- Choose a Plan to Start --</option>
              {allPlans.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.id} (FY {plan.fiscalYear}) - {plan.name || 'Annual Plan'}
                </option>
              ))}
            </select>
            <p className="text-xs text-text-mid dark:text-text-mid mt-1">
              {allPlans.length} approved plan(s) available
            </p>
          </div>
        </div>

        {allPlans.length === 0 && (
          <div className="bg-ink dark:bg-ink border border-danger dark:border-danger rounded-lg p-4">
            <p className="text-sm text-danger dark:text-danger font-bold">
              ⚠️ No APPROVED plans available
            </p>
            <p className="text-xs text-text-mid dark:text-text-mid mt-1">
              Ask your Regional Director to approve plans first
            </p>
          </div>
        )}
      </div>
    );
  }

  // Main cascade view
  return (
    <div className="p-8">
      <h2 className="mb-8"><i className="fas fa-tasks"></i> Cascade to Audit Cases</h2>

      {/* Plan Switcher - PROMINENT at top */}
      {allPlans.length > 0 && (
        <div className="bg-ink dark:bg-ink text-text-hi dark:text-text-hi p-4 rounded-lg mb-8 border-2 border-blue dark:border-blue flex gap-4 items-center flex-wrap">
          <label className="text-sm font-bold text-blue dark:text-blue whitespace-nowrap">
            <i className="fas fa-file-alt"></i> CURRENT PLAN:
          </label>
          <select value={selectedPlan || ''} onChange={(e) => setSelectedPlan(e.target.value || null)}
            className="px-3 py-2 rounded-md border-2 border-blue dark:border-blue text-sm font-semibold cursor-pointer bg-panel dark:bg-panel-dark text-text-hi dark:text-text-hi min-w-[220px] focus:outline-none focus:border-blue dark:focus:border-blue">
            <option value="">-- Select a Plan --</option>
            {allPlans.map(plan => (
              <option key={plan.id} value={plan.id}>
                {plan.id} (FY {plan.fiscalYear})
              </option>
            ))}
          </select>
          <div className="text-xs text-text-mid dark:text-text-mid ml-auto">
            {allPlans.length} total plan(s) available
          </div>
        </div>
      )}

      {/* Selection & Plan Overview */}
      <div className="bg-panel dark:bg-panel-dark p-4 rounded-lg mb-8 border border-border dark:border-border-dark">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-text-hi dark:text-text-hi m-0">📋 PLAN ALLOCATION FOR THIS TAX CENTER</h3>
          <button onClick={() => { setSelectedPlan(null); setSelectedRegion(null); setSelectedTaxCenter(null); }}
            className="px-2 py-1 text-xs border border-border dark:border-border-dark rounded-md bg-ink dark:bg-ink text-text-mid dark:text-text-mid cursor-pointer hover:bg-panel dark:hover:bg-panel transition-colors">← Back to Select</button>
        </div>
        
        <div className="grid grid-cols-auto-fit gap-3 mb-3">
          <div className="bg-ink dark:bg-ink p-2 rounded-md border border-border dark:border-border-dark">
            <p className="text-xs text-text-mid dark:text-text-mid m-0 mb-1">PLAN ID</p>
            <p className="text-sm font-bold text-success dark:text-success m-0">{selectedPlan}</p>
          </div>
          <div className="bg-ink dark:bg-ink p-2 rounded-md border border-border dark:border-border-dark">
            <p className="text-xs text-text-mid dark:text-text-mid m-0 mb-1">REGION</p>
            <p className="text-sm font-bold text-blue dark:text-blue m-0">{selectedRegion}</p>
          </div>
          <div className="bg-ink dark:bg-ink p-2 rounded-md border border-border dark:border-border-dark">
            <p className="text-xs text-text-mid dark:text-text-mid m-0 mb-1">TAX CENTER</p>
            <p className="text-sm font-bold text-gold dark:text-gold m-0">{selectedTaxCenter}</p>
          </div>
          <div className="bg-ink dark:bg-ink p-2 rounded-md border border-border dark:border-border-dark">
            <p className="text-xs text-text-mid dark:text-text-mid m-0 mb-1">TOTAL ALLOCATED</p>
            <p className={`text-sm font-bold m-0 ${totalAllocated === 0 ? 'text-danger dark:text-danger' : 'text-success dark:text-success'}`}>{totalAllocated} Cases</p>
          </div>
        </div>

        {/* Warning if no allocation */}
        {totalAllocated === 0 && taxCenterAllocation === undefined && (
          <div className="bg-ink dark:bg-ink border border-danger dark:border-danger rounded-lg p-3 mt-3">
            <p className="text-xs text-danger dark:text-danger m-0 font-bold">
              ⚠️ NO ALLOCATION FOUND
            </p>
            <p className="text-xs text-text-mid dark:text-text-mid m-1 mt-1">
              This plan does not have allocations sent to {selectedTaxCenter} in {selectedRegion}.
            </p>
            <p className="text-xs text-text-mid dark:text-text-mid m-0 mt-1">
              Please ask the Director to send allocations for this tax center before cascading.
            </p>
          </div>
        )}
      </div>

      {/* Allocations - THIS TAX CENTER ONLY */}
      <div className="mb-8">
        <h3 className="text-sm font-bold mb-3 text-text-hi dark:text-text-hi">✅ THIS TAX CENTER's ALLOCATION BREAKDOWN</h3>
        <p className="text-xs text-text-mid dark:text-text-mid mb-3">
          Total cases allocated to {selectedTaxCenter}: <strong className={totalAllocated === 0 ? 'text-danger dark:text-danger' : 'text-success dark:text-success'}>{totalAllocated}</strong>
        </p>
        
        {totalAllocated === 0 ? (
          <div className="bg-panel dark:bg-panel-dark p-8 rounded-lg border border-border dark:border-border-dark text-center">
            <p className="text-sm text-text-mid dark:text-text-mid m-0">No allocation data available for this tax center.</p>
            <p className="text-xs text-danger dark:text-danger m-0 mt-2 font-bold">
              ⚠️ Cascade cannot proceed without allocation
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-auto-fit gap-3">
            {Object.entries(allocationSummary).map(([type, data]) => (
              <div key={type} className={`bg-panel dark:bg-panel-dark p-3 rounded-lg ${data.remaining === 0 ? 'border-2 border-danger dark:border-danger shadow-lg shadow-danger/20' : 'border border-border dark:border-border-dark'}`}>
                <p className="text-xs font-bold text-text-hi dark:text-text-hi m-0 mb-1">{type}</p>
                <p className="text-sm font-bold text-success dark:text-success m-0 mb-1">
                  {data.cascaded} / {data.total}
                </p>
                <p className={`text-xs m-0 ${data.remaining === 0 ? 'text-danger dark:text-danger' : 'text-text-mid dark:text-text-mid'}`}>
                  {data.remaining === 0 ? '🔴 FULL' : `Remaining: ${data.remaining}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="mb-8">
        <h3 className="text-sm font-bold mb-3 text-text-hi dark:text-text-hi">🔍 SELECT TAXPAYERS TO CASCADE</h3>
        <p className="text-xs text-text-mid dark:text-text-mid mb-3">
          Filter taxpayers by risk, audit type, or name. Allocation limits are enforced automatically.
        </p>
      </div>

      {totalAllocated === 0 ? (
        <div className="bg-ink dark:bg-ink border-2 border-danger dark:border-danger rounded-lg p-8 text-center mb-8">
          <p className="text-sm text-danger dark:text-danger m-0 font-bold">❌ CANNOT PROCEED</p>
          <p className="text-xs text-text-mid dark:text-text-mid m-0 mt-2">
            This plan has no allocation for {selectedTaxCenter} in {selectedRegion}.
          </p>
          <p className="text-xs text-text-mid dark:text-text-mid m-0 mt-2">
            The Director/Regional Director must send allocations to this tax center first.
          </p>
          <button onClick={() => { setSelectedPlan(null); setSelectedRegion(null); setSelectedTaxCenter(null); }}
            className="mt-4 px-4 py-2 border border-danger dark:border-danger rounded-md bg-transparent text-danger dark:text-danger text-xs font-semibold cursor-pointer hover:bg-danger/10 transition-colors">
            ← Back to Selection
          </button>
        </div>
      ) : (
        <>
          <div className="bg-panel dark:bg-panel-dark p-3 rounded-lg mb-8 flex gap-2 flex-wrap border border-border dark:border-border-dark">
            <input type="text" placeholder="Search TIN or name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[150px] px-2 py-1 border border-border dark:border-border-dark rounded-md bg-ink dark:bg-ink text-text-hi dark:text-text-hi text-xs focus:outline-none focus:border-gold dark:focus:border-gold" />
            
            <select value={filterRiskLevel} onChange={(e) => setFilterRiskLevel(e.target.value)}
              className="px-2 py-1 border border-border dark:border-border-dark rounded-md bg-ink dark:bg-ink text-text-hi dark:text-text-hi text-xs focus:outline-none focus:border-gold">
              <option value="All">All Risk</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select value={filterAuditType} onChange={(e) => setFilterAuditType(e.target.value)}
              className="px-2 py-1 border border-border dark:border-border-dark rounded-md bg-ink dark:bg-ink text-text-hi dark:text-text-hi text-xs focus:outline-none focus:border-gold">
              <option value="All">All Types</option>
              <option value="Comprehensive">Comprehensive</option>
              <option value="Field Audit">Field Audit</option>
              <option value="Desk Audit">Desk Audit</option>
              <option value="Joint Audit">Joint Audit</option>
              <option value="Transfer Pricing">TP</option>
            </select>

            <button onClick={() => { setSearchTerm(''); setFilterRiskLevel('All'); setFilterAuditType('All'); }}
              className="px-2 py-1 border border-border dark:border-border-dark rounded-md bg-ink dark:bg-ink text-text-mid dark:text-text-mid text-xs cursor-pointer hover:bg-panel dark:hover:bg-panel transition-colors">Clear</button>
          </div>

          {/* Table */}
          <div className="table-container mb-8 overflow-x-auto border border-border dark:border-border-dark rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-panel dark:bg-panel-dark border-b border-border dark:border-border-dark">
                <tr>
                  <th className="w-10 text-left px-3 py-2">☑</th>
                  <th className="text-left px-3 py-2 text-text-mid dark:text-text-mid font-semibold text-xs">TIN</th>
                  <th className="text-left px-3 py-2 text-text-mid dark:text-text-mid font-semibold text-xs">TAXPAYER</th>
                  <th className="text-left px-3 py-2 text-text-mid dark:text-text-mid font-semibold text-xs">RISK</th>
                  <th className="text-left px-3 py-2 text-text-mid dark:text-text-mid font-semibold text-xs">AUDIT TYPE</th>
                  <th className="text-left px-3 py-2 text-text-mid dark:text-text-mid font-semibold text-xs">REVENUE</th>
                  <th className="text-left px-3 py-2 text-text-mid dark:text-text-mid font-semibold text-xs">HOURS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-border-dark">
                {paginatedTaxpayers.map(taxpayer => {
                  const isSelected = selectedTaxpayers.has(`${taxpayer.id}-${taxpayer.recommendedAuditType}`);
                  const auditTypeKey = getAuditTypeKey(taxpayer.recommendedAuditType);
                  const slotsAvailable = remainingAllocations[auditTypeKey] || 0;
                  const canSelect = slotsAvailable > 0 || isSelected;
                  
                  return (
                    <tr key={taxpayer.id} className={`border-b border-border dark:border-border-dark hover:bg-panel/50 dark:hover:bg-panel-dark/50 transition-colors ${!canSelect ? 'opacity-40' : ''}`}>
                      <td className="px-3 py-2"><input type="checkbox" checked={isSelected} onChange={() => canSelect && toggleTaxpayerSelection(taxpayer.id)} disabled={!canSelect} /></td>
                      <td className="px-3 py-2 text-text-hi dark:text-text-hi text-xs">{taxpayer.tin}</td>
                      <td className="px-3 py-2 text-text-hi dark:text-text-hi text-xs">{taxpayer.name}</td>
                      <td className="px-3 py-2"><Badge status={taxpayer.riskLevel} className="feedback" /></td>
                      <td className={`px-3 py-2 text-xs ${slotsAvailable > 0 ? 'text-success dark:text-success' : 'text-danger dark:text-danger'}`}>
                        {taxpayer.recommendedAuditType} {slotsAvailable <= 0 && !isSelected ? '❌' : ''}
                      </td>
                      <td className="px-3 py-2 text-text-hi dark:text-text-hi text-xs">{(taxpayer.revenueAtRisk / 1000000).toFixed(1)}M</td>
                      <td className="px-3 py-2 text-text-hi dark:text-text-hi text-xs">{taxpayer.estimatedHours}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="bg-panel dark:bg-panel-dark p-3 rounded-lg border border-border dark:border-border-dark">
              <p className="text-xs font-bold text-text-hi dark:text-text-hi m-0 mb-1">YOUR SELECTION</p>
              <p className={`text-lg font-bold m-0 mb-1 ${selectionSummary.count > totalAllocated ? 'text-danger dark:text-danger' : 'text-success dark:text-success'}`}>
                {selectionSummary.count} / {totalAllocated}
              </p>
              <p className="text-xs text-text-mid dark:text-text-mid m-0">
                {selectionSummary.count === 0 ? 'No cases selected' : 
                 selectionSummary.count === totalAllocated ? '✅ FULL ALLOCATION' :
                 selectionSummary.count > totalAllocated ? '❌ EXCEEDS LIMIT' :
                 `${totalAllocated - selectionSummary.count} slots remaining`}
              </p>
            </div>
            <div className="bg-panel dark:bg-panel-dark p-3 rounded-lg border border-border dark:border-border-dark">
              <p className="text-xs font-bold text-text-hi dark:text-text-hi m-0 mb-1">IMPACT</p>
              <p className="text-xs text-text-mid dark:text-text-mid m-0 mb-1">Revenue: <strong>{(selectionSummary.totalRevenue / 1000000).toFixed(1)}M</strong></p>
              <p className="text-xs text-text-mid dark:text-text-mid m-0">Audit Hours: <strong>{selectionSummary.totalHours.toLocaleString()}</strong></p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-between gap-2">
            <div className="flex gap-2">
              <button onClick={() => { setSelectedPlan(null); setSelectedRegion(null); setSelectedTaxCenter(null); }}
                className="px-3 py-2 border border-border dark:border-border-dark rounded-md bg-ink dark:bg-ink text-text-mid dark:text-text-mid text-xs font-semibold cursor-pointer hover:bg-panel dark:hover:bg-panel transition-colors">Back</button>
              
              <button onClick={handleAutoCascade}
                className="px-3 py-2 border border-blue dark:border-blue rounded-md bg-ink dark:bg-ink text-blue dark:text-blue text-xs font-semibold cursor-pointer hover:bg-blue/10 transition-colors">Auto Cascade</button>

              <button onClick={handleClearSelection} disabled={selectedTaxpayers.size === 0}
                className={`px-3 py-2 border border-border dark:border-border-dark rounded-md bg-ink dark:bg-ink text-text-mid dark:text-text-mid text-xs font-semibold cursor-pointer hover:bg-panel dark:hover:bg-panel transition-colors ${selectedTaxpayers.size === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>Clear</button>
            </div>

            <button onClick={handleCreateCases} disabled={selectedTaxpayers.size === 0 || selectionSummary.count > totalAllocated}
              className={`px-3 py-2 rounded-md text-white text-xs font-semibold cursor-pointer transition-colors ${(selectedTaxpayers.size === 0 || selectionSummary.count > totalAllocated) ? 'bg-text-mid dark:bg-text-mid opacity-50 cursor-not-allowed' : 'bg-blue dark:bg-blue hover:opacity-90'}`}>
              Create {selectionSummary.count} / {totalAllocated} Cases
            </button>
          </div>
        </>
      )}
    </div>
  );
}
export default CascadePlanToCasesView;
