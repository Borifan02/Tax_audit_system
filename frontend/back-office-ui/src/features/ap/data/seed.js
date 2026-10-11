import { REGIONS, AUDIT_TYPES, TAX_CENTERS, getRiskLevel } from './constants.js';
import { generateCasesFromPlan, getTaxpayersForTaxCenter } from './taxpayers.js';

// ============================================================
// SEED USERS
// ============================================================
export const SEED_USERS = [
  // Planning Team
  { id: 'planning-01', name: 'Eden Haile', email: 'planning.eden.haile@mor.gov.et', legacyUsername: 'u-pt-01', legacyEmail: 'eden.haile@mor.gov.et',         role: 'planning_team',     region: null,          taxCenter: null,          password: 'password123' },
  { id: 'planning-02', name: 'Samuel Worku', email: 'planning.samuel.worku@mor.gov.et', legacyUsername: 'u-pt-02', legacyEmail: 'samuel.worku@mor.gov.et',       role: 'planning_team',     region: null,          taxCenter: null,          password: 'password123' },
  { id: 'planning-03', name: 'Yodit Kassa', email: 'planning.yodit.kassa@mor.gov.et', legacyUsername: 'u-pt-03', legacyEmail: 'yodit.kassa@mor.gov.et',        role: 'planning_team',     region: null,          taxCenter: null,          password: 'password123' },
  // Audit Director
  { id: 'director-01', name: 'Getnet Bekele', email: 'director.getnet.bekele@mor.gov.et', legacyUsername: 'u-ad-01', legacyEmail: 'getnet.bekele@mor.gov.et',      role: 'audit_director',    region: null,          taxCenter: null,          password: 'password123' },
  // Senior Management
  { id: 'seniormanagement-01', name: 'Almaz Berhane', email: 'seniormanagement.almaz.berhane@mor.gov.et', legacyUsername: 'u-sm-01', legacyEmail: 'almaz.berhane@mor.gov.et',      role: 'senior_management', region: null,          taxCenter: null,          password: 'password123' },
  { id: 'seniormanagement-02', name: 'Workneh Wolde', email: 'seniormanagement.workneh.wolde@mor.gov.et', legacyUsername: 'u-sm-02', legacyEmail: 'workneh.wolde@mor.gov.et',      role: 'senior_management', region: null,          taxCenter: null,          password: 'password123' },
  // External & Internal Directorate Audit Requesters
  { id: 'auditrequester-01', name: 'Getachew Zewde', email: 'auditrequester.getachew.zewde@mor.gov.et', legacyUsername: 'u-req-01', legacyEmail: 'getachew.zewde@mor.gov.et', role: 'audit_requester', region: 'federal_level', taxCenter: 'federal-lto1', password: 'password123' },
  { id: 'auditrequester-02', name: 'Tigist Worku', email: 'auditrequester.tigist.worku@mor.gov.et', legacyUsername: 'u-req-02', legacyEmail: 'tigist.worku@mor.gov.et', role: 'audit_requester', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', password: 'password123' },
  { id: 'auditrequester-03', name: 'Deriba Alemayehu', email: 'auditrequester.deriba.alemayehu@mor.gov.et', legacyUsername: 'u-req-03', legacyEmail: 'deriba.alemayehu@mor.gov.et', role: 'audit_requester', region: 'federal_level', taxCenter: 'federal-lto1', password: 'password123' },
  { id: 'auditrequester-04', name: 'Ministry of Trade (Ibrahim Tesfa)', email: 'auditrequester.ibrahim.tesfa@mor.gov.et', legacyUsername: 'u-req-04', legacyEmail: 'external.motri@gov.et', role: 'audit_requester', region: 'addis_ababa', taxCenter: 'addis_ababa-tc2', password: 'password123' },
  // Regional Directors
  { id: 'regionaldirector-fed', name: 'Berihun Lemma', email: 'regionaldirector.berihun.lemma@mor.gov.et', legacyUsername: 'u-rd-fed', legacyEmail: 'berihun.lemma@mor.gov.et', role: 'regional_director', region: 'federal_level', taxCenter: null, password: 'password123' },
  { id: 'regionaldirector-aa', name: 'Getnet Alemu', email: 'regionaldirector.getnet.alemu@mor.gov.et', legacyUsername: 'u-rd-aa', legacyEmail: 'getnet.alemu@mor.gov.et',       role: 'regional_director', region: 'addis_ababa', taxCenter: null,          password: 'password123' },
  { id: 'regionaldirector-am', name: 'Tadesse Kebede', email: 'regionaldirector.tadesse.kebede@mor.gov.et', legacyUsername: 'u-rd-am', legacyEmail: 'tadesse.kebede@mor.gov.et',     role: 'regional_director', region: 'amhara',      taxCenter: null,          password: 'password123' },
  { id: 'regionaldirector-or', name: 'Gemechu Negash', email: 'regionaldirector.gemechu.negash@mor.gov.et', legacyUsername: 'u-rd-or', legacyEmail: 'gemechu.negash@mor.gov.et',     role: 'regional_director', region: 'oromia',      taxCenter: null,          password: 'password123' },
  { id: 'regionaldirector-sn', name: 'Tekle Lemma', email: 'regionaldirector.tekle.lemma@mor.gov.et', legacyUsername: 'u-rd-sn', legacyEmail: 'tekle.lemma@mor.gov.et',        role: 'regional_director', region: 'snnpr',       taxCenter: null,          password: 'password123' },
  { id: 'regionaldirector-so', name: 'Ibrahim Hassan', email: 'regionaldirector.ibrahim.hassan@mor.gov.et', legacyUsername: 'u-rd-so', legacyEmail: 'ibrahim.hassan@mor.gov.et',     role: 'regional_director', region: 'somali',      taxCenter: null,          password: 'password123' },

  // ── Joint Audit Statutory Personnel (Addis Ababa TC1 & Federal LTO1) ──
  { id: 'committeechair-aa1', name: 'Dr. Abebe Kebede', email: 'committeechair.abebe.kebede@mor.gov.et', legacyUsername: 'aa1.chair', legacyEmail: 'aa1.chair@mor.gov.et', role: 'committee_chair', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', auditType: 'joint_audit', password: 'password123' },
  { id: 'committeemember-aa1', name: 'Fatuma Ahmed', email: 'committeemember.fatuma.ahmed@mor.gov.et', legacyUsername: 'aa1.member', legacyEmail: 'aa1.member@mor.gov.et', role: 'committee_member', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', auditType: 'joint_audit', password: 'password123' },
  { id: 'teamleader-aa1-1', name: 'Dawit Tadesse', email: 'teamleader.dawit.tadesse@mor.gov.et', legacyUsername: 'aa1.tl', legacyEmail: 'aa1.tl@mor.gov.et', role: 'team_leader', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', auditType: 'joint_audit', password: 'password123' },
  { id: 'auditor-aa1-1', name: 'Sara Mohammed', email: 'auditor.sara.mohammed@mor.gov.et', legacyUsername: 'aa1.auditor1', legacyEmail: 'aa1.auditor1@mor.gov.et', role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', auditType: 'joint_audit', password: 'password123' },
  { id: 'auditor-aa1-2', name: 'Yonas Berhanu', email: 'auditor.yonas.berhanu@mor.gov.et', legacyUsername: 'aa1.auditor2', legacyEmail: 'aa1.auditor2@mor.gov.et', role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', auditType: 'joint_audit', password: 'password123' },
  { id: 'auditor-aa1-3', name: 'Hana Girma', email: 'auditor.hana.girma@mor.gov.et', legacyUsername: 'aa1.auditor3', legacyEmail: 'aa1.auditor3@mor.gov.et', role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', auditType: 'joint_audit', password: 'password123' },
  { id: 'auditor-aa1-4', name: 'Mulugeta Alemayehu', email: 'auditor.mulugeta.alemayehu@mor.gov.et', legacyUsername: 'aa1.auditor4', legacyEmail: 'aa1.auditor4@mor.gov.et', role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', auditType: 'joint_audit', password: 'password123' },
  { id: 'auditor-aa1-5', name: 'Tigist Haile', email: 'auditor.tigist.haile@mor.gov.et', legacyUsername: 'aa1.auditor5', legacyEmail: 'aa1.auditor5@mor.gov.et', role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', auditType: 'joint_audit', password: 'password123' },
  { id: 'taxcentermanager-addis_ababa-tc1', name: 'Manager Addis Ababa TC1', email: 'taxcentermanager.addis_ababa_tc1@mor.gov.et', legacyUsername: 'aa1.manager', legacyEmail: 'aa1.manager@mor.gov.et', role: 'tax_center_manager', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', password: 'password123' },

  { id: 'committeechair-federal-lto1-ja', name: 'Dr. Solomon Desta', email: 'committeechair.solomon.desta@mor.gov.et', legacyUsername: 'fed.ja.chair', legacyEmail: 'fed.ja.chair@mor.gov.et', role: 'committee_chair', region: 'federal_level', taxCenter: 'federal-lto1', auditType: 'joint_audit', password: 'password123' },
  { id: 'committeemember-federal-lto1-ja', name: 'Eleni Tesfaye', email: 'committeemember.eleni.tesfaye@mor.gov.et', legacyUsername: 'fed.ja.member', legacyEmail: 'fed.ja.member@mor.gov.et', role: 'committee_member', region: 'federal_level', taxCenter: 'federal-lto1', auditType: 'joint_audit', password: 'password123' },
  { id: 'teamleader-federal-lto1-ja-1', name: 'Abebe Haile', email: 'teamleader.abebe.haile@mor.gov.et', legacyUsername: 'fed.ja.tl', legacyEmail: 'fed.ja.tl@mor.gov.et', role: 'team_leader', region: 'federal_level', taxCenter: 'federal-lto1', auditType: 'joint_audit', password: 'password123' },
  { id: 'auditor-federal-lto1-ja-1', name: 'Fikremariam Tilahun', email: 'auditor.fikremariam.tilahun@mor.gov.et', legacyUsername: 'fed.ja.auditor1', legacyEmail: 'fed.ja.auditor1@mor.gov.et', role: 'auditor', region: 'federal_level', taxCenter: 'federal-lto1', auditType: 'joint_audit', password: 'password123' },
  { id: 'auditor-federal-lto1-ja-2', name: 'Saron Assefa', email: 'auditor.saron.assefa@mor.gov.et', legacyUsername: 'fed.ja.auditor2', legacyEmail: 'fed.ja.auditor2@mor.gov.et', role: 'auditor', region: 'federal_level', taxCenter: 'federal-lto1', auditType: 'joint_audit', password: 'password123' },
  { id: 'auditor-federal-lto1-ja-3', name: 'Bikila Worku', email: 'auditor.bikila.worku@mor.gov.et', legacyUsername: 'fed.ja.auditor3', legacyEmail: 'fed.ja.auditor3@mor.gov.et', role: 'auditor', region: 'federal_level', taxCenter: 'federal-lto1', auditType: 'joint_audit', password: 'password123' },
  { id: 'auditor-federal-lto1-ja-4', name: 'Michael Zewde', email: 'auditor.michael.zewde@mor.gov.et', legacyUsername: 'fed.ja.auditor4', legacyEmail: 'fed.ja.auditor4@mor.gov.et', role: 'auditor', region: 'federal_level', taxCenter: 'federal-lto1', auditType: 'joint_audit', password: 'password123' },
  { id: 'auditor-federal-lto1-ja-5', name: 'Saron Negash', email: 'auditor.saron.negash@mor.gov.et', legacyUsername: 'fed.ja.auditor5', legacyEmail: 'fed.ja.auditor5@mor.gov.et', role: 'auditor', region: 'federal_level', taxCenter: 'federal-lto1', auditType: 'joint_audit', password: 'password123' },
  { id: 'taxcentermanager-federal-lto1', name: 'Tsega Mulugeta', email: 'taxcentermanager.tsega.mulugeta@mor.gov.et', legacyUsername: 'u-tcm-federal-lto1', legacyEmail: 'tsega.mulugeta@mor.gov.et', role: 'tax_center_manager', region: 'federal_level', taxCenter: 'federal-lto1', password: 'password123' },

  // Federal LTO-2 Joint Audit Team
  { id: 'committeechair-federal-lto2-ja', name: 'Dr. Worku Alemayehu', email: 'committeechair.worku.alemayehu@mor.gov.et', legacyUsername: 'fed2.ja.chair', legacyEmail: 'fed2.ja.chair@mor.gov.et', role: 'committee_chair', region: 'federal_level', taxCenter: 'federal-lto2', auditType: 'joint_audit', password: 'password123' },
  { id: 'committeemember-federal-lto2-ja', name: 'Tigist Hailu', email: 'committeemember.tigist.hailu@mor.gov.et', legacyUsername: 'fed2.ja.member', legacyEmail: 'fed2.ja.member@mor.gov.et', role: 'committee_member', region: 'federal_level', taxCenter: 'federal-lto2', auditType: 'joint_audit', password: 'password123' },
  { id: 'teamleader-federal-lto2-ja-1', name: 'Berhanu Bekele', email: 'teamleader.berhanu.bekele@mor.gov.et', legacyUsername: 'fed2.ja.tl', legacyEmail: 'fed2.ja.tl@mor.gov.et', role: 'team_leader', region: 'federal_level', taxCenter: 'federal-lto2', auditType: 'joint_audit', password: 'password123' },
  { id: 'auditor-federal-lto2-ja-1', name: 'Dawit Mengistu', email: 'auditor.dawit.mengistu@mor.gov.et', legacyUsername: 'fed2.ja.auditor1', legacyEmail: 'fed2.ja.auditor1@mor.gov.et', role: 'auditor', region: 'federal_level', taxCenter: 'federal-lto2', auditType: 'joint_audit', password: 'password123' },
  { id: 'auditor-federal-lto2-ja-2', name: 'Eden Tadesse', email: 'auditor.eden.tadesse@mor.gov.et', legacyUsername: 'fed2.ja.auditor2', legacyEmail: 'fed2.ja.auditor2@mor.gov.et', role: 'auditor', region: 'federal_level', taxCenter: 'federal-lto2', auditType: 'joint_audit', password: 'password123' },
  { id: 'auditor-federal-lto2-ja-3', name: 'Henok Girma', email: 'auditor.henok.girma@mor.gov.et', legacyUsername: 'fed2.ja.auditor3', legacyEmail: 'fed2.ja.auditor3@mor.gov.et', role: 'auditor', region: 'federal_level', taxCenter: 'federal-lto2', auditType: 'joint_audit', password: 'password123' },
  { id: 'auditor-federal-lto2-ja-4', name: 'Meron Kebede', email: 'auditor.meron.kebede@mor.gov.et', legacyUsername: 'fed2.ja.auditor4', legacyEmail: 'fed2.ja.auditor4@mor.gov.et', role: 'auditor', region: 'federal_level', taxCenter: 'federal-lto2', auditType: 'joint_audit', password: 'password123' },
  { id: 'auditor-federal-lto2-ja-5', name: 'Natnael Assefa', email: 'auditor.natnael.assefa@mor.gov.et', legacyUsername: 'fed2.ja.auditor5', legacyEmail: 'fed2.ja.auditor5@mor.gov.et', role: 'auditor', region: 'federal_level', taxCenter: 'federal-lto2', auditType: 'joint_audit', password: 'password123' },
  { id: 'taxcentermanager-federal-lto2', name: 'Tirhas Gebre', email: 'taxcentermanager.tirhas.gebre@mor.gov.et', legacyUsername: 'u-tcm-federal-lto2', legacyEmail: 'tirhas.gebre@mor.gov.et', role: 'tax_center_manager', region: 'federal_level', taxCenter: 'federal-lto2', password: 'password123' },

  // Tax Center Managers — Federal LTO
  { id: 'u-tc-fed1', name: 'Kassahun Bekele', email: 'kassahun.bekele@mor.gov.et', role: 'tax_center_manager', region: 'federal_level', taxCenter: 'federal-lto1', password: 'password123' },
  { id: 'u-tc-fed2', name: 'Tirhas Gebre',    email: 'tirhas.gebre@mor.gov.et',    role: 'tax_center_manager', region: 'federal_level', taxCenter: 'federal-lto2', password: 'password123' },

  // Tax Center Managers — Addis Ababa
  { id: 'u-tc-aa1', name: 'Mekdes Solomon',  email: 'mekdes.solomon@mor.gov.et',     role: 'tax_center_manager',region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', password: 'password123' },
  { id: 'u-tc-aa2', name: 'Dereje Worku',    email: 'dereje.worku@mor.gov.et',       role: 'tax_center_manager',region: 'addis_ababa', taxCenter: 'addis_ababa-tc2', password: 'password123' },
  { id: 'u-tc-aa3', name: 'Selam Tekle',     email: 'selam.tekle@mor.gov.et',        role: 'tax_center_manager',region: 'addis_ababa', taxCenter: 'addis_ababa-tc3', password: 'password123' },
  // Tax Center Managers — Oromia
  { id: 'u-tc-or1', name: 'Chaltu Girma',    email: 'chaltu.girma@mor.gov.et',       role: 'tax_center_manager',region: 'oromia',      taxCenter: 'oromia-tc1',      password: 'password123' },
  { id: 'u-tc-or2', name: 'Diriba Lema',     email: 'diriba.lema@mor.gov.et',        role: 'tax_center_manager',region: 'oromia',      taxCenter: 'oromia-tc2',      password: 'password123' },
  { id: 'u-tc-or3', name: 'Fatuma Umer',     email: 'fatuma.umer@mor.gov.et',        role: 'tax_center_manager',region: 'oromia',      taxCenter: 'oromia-tc3',      password: 'password123' },

  // Team Leaders — Federal LTO 1
  { id: 'u-tl-fed1a', name: 'Abebe Bikila (Desk TL - LTO1)',  email: 'abebe.bikila@mor.gov.et',  role: 'team_leader', region: 'federal_level', taxCenter: 'federal-lto1', auditType: 'desk_audit',       password: 'password123' },
  { id: 'u-tl-fed1b', name: 'Mulugeta Tesfaye (Comp TL - LTO1)', email: 'mulugeta.t@mor.gov.et', role: 'team_leader', region: 'federal_level', taxCenter: 'federal-lto1', auditType: 'comprehensive',    password: 'password123' },
  { id: 'u-tl-fed1c', name: 'Birtukan Mideksa (TP TL - LTO1)', email: 'birtukan.m@mor.gov.et', role: 'team_leader', region: 'federal_level', taxCenter: 'federal-lto1', auditType: 'transfer_pricing', password: 'password123' },
  { id: 'u-tl-fed1d', name: 'Genet Zewde (Issue TL - LTO1)',   email: 'genet.zewde@mor.gov.et',   role: 'team_leader', region: 'federal_level', taxCenter: 'federal-lto1', auditType: 'issue_audit',      password: 'password123' },
  
  // Team Leaders — AA-TC1 (All audit types covered)
  { id: 'u-tl-aa1a', name: 'Henok Belay (Desk TL)',      email: 'henok.belay@mor.gov.et',        role: 'team_leader',       region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', auditType: 'desk_audit',         password: 'password123' },
  { id: 'u-tl-aa1b', name: 'Tigist Alemu (Field TL)',     email: 'tigist.alemu@mor.gov.et',       role: 'team_leader',       region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', auditType: 'field_audit',        password: 'password123' },
  { id: 'u-tl-aa1c', name: 'Melaku Bekele (Joint TL)', email: 'melaku.bekele@mor.gov.et',      role: 'team_leader',       region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', auditType: 'joint_audit',        password: 'password123' },
  { id: 'u-tl-aa1d', name: 'Seble Tesfaye (Comp TL)',    email: 'seble.tesfaye@mor.gov.et',      role: 'team_leader',       region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', auditType: 'comprehensive',      password: 'password123' },
  { id: 'u-tl-aa1e', name: 'Dawit Mulugeta (TP TL)',   email: 'dawit.mulugeta@mor.gov.et',     role: 'team_leader',       region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', auditType: 'transfer_pricing',   password: 'password123' },
  { id: 'u-tl-aa1f', name: 'Sara Negash (Issue TL)',      email: 'sara.negash@mor.gov.et',        role: 'team_leader',       region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', auditType: 'issue_audit',        password: 'password123' },
  
  // Team Leaders — AA-TC2 (All audit types covered)
  { id: 'u-tl-aa2a', name: 'Fikadu Desta (Desk TL)',     email: 'fikadu.desta@mor.gov.et',       role: 'team_leader',       region: 'addis_ababa', taxCenter: 'addis_ababa-tc2', auditType: 'desk_audit',         password: 'password123' },
  { id: 'u-tl-aa2b', name: 'Almaz Worku (Field TL)',      email: 'almaz.worku@mor.gov.et',        role: 'team_leader',       region: 'addis_ababa', taxCenter: 'addis_ababa-tc2', auditType: 'field_audit',        password: 'password123' },
  { id: 'u-tl-aa2c', name: 'Biruk Gebre (Comp TL)',      email: 'biruk.gebre@mor.gov.et',        role: 'team_leader',       region: 'addis_ababa', taxCenter: 'addis_ababa-tc2', auditType: 'comprehensive',      password: 'password123' },
  { id: 'u-tl-aa2d', name: 'Hana Abebe (TP TL)',       email: 'hana.abebe@mor.gov.et',         role: 'team_leader',       region: 'addis_ababa', taxCenter: 'addis_ababa-tc2', auditType: 'transfer_pricing',   password: 'password123' },
  { id: 'u-tl-aa2e', name: 'Daniel Kebede (Issue TL)',    email: 'daniel.kebede@mor.gov.et',      role: 'team_leader',       region: 'addis_ababa', taxCenter: 'addis_ababa-tc2', auditType: 'issue_audit',        password: 'password123' },
  
  // Team Leaders — AA-TC3 (All audit types covered)
  { id: 'u-tl-aa3a', name: 'Marta Yohannes (Desk TL)',   email: 'marta.yohannes@mor.gov.et',     role: 'team_leader',       region: 'addis_ababa', taxCenter: 'addis_ababa-tc3', auditType: 'desk_audit',         password: 'password123' },
  { id: 'u-tl-aa3b', name: 'Getnet Assefa (Field TL)',    email: 'getnet.assefa@mor.gov.et',      role: 'team_leader',       region: 'addis_ababa', taxCenter: 'addis_ababa-tc3', auditType: 'field_audit',        password: 'password123' },
  { id: 'u-tl-aa3c', name: 'Bethlehem Girma (Comp TL)',  email: 'bethlehem.girma@mor.gov.et',    role: 'team_leader',       region: 'addis_ababa', taxCenter: 'addis_ababa-tc3', auditType: 'comprehensive',      password: 'password123' },
  { id: 'u-tl-aa3d', name: 'Yosef Lemma (TP TL)',      email: 'yosef.lemma@mor.gov.et',        role: 'team_leader',       region: 'addis_ababa', taxCenter: 'addis_ababa-tc3', auditType: 'transfer_pricing',   password: 'password123' },
  { id: 'u-tl-aa3e', name: 'Eleni Tadesse (Issue TL)',    email: 'eleni.tadesse@mor.gov.et',      role: 'team_leader',       region: 'addis_ababa', taxCenter: 'addis_ababa-tc3', auditType: 'issue_audit',        password: 'password123' },
  
  // Team Leaders — OR-TC1
  { id: 'u-tl-or1a', name: 'Lalisa Wakjira (Desk TL)',email: 'lalisa.wakjira@mor.gov.et',     role: 'team_leader',       region: 'oromia',      taxCenter: 'oromia-tc1',      auditType: 'desk_audit',   password: 'password123' },

  // Auditors — Federal LTO 1
  { id: 'u-aud-fed1a', name: 'Tewodros Kassahun (LTO Auditor)', email: 'tewodros.k@mor.gov.et', role: 'auditor', region: 'federal_level', taxCenter: 'federal-lto1', teamLeader: 'u-tl-fed1a', password: 'password123' },
  { id: 'u-aud-fed1b', name: 'Mesfin Wolde (LTO Auditor)',    email: 'mesfin.wolde@mor.gov.et', role: 'auditor', region: 'federal_level', taxCenter: 'federal-lto1', teamLeader: 'u-tl-fed1b', password: 'password123' },

  // Auditors — AA-TC1 (Multiple auditors per TL)
  { id: 'u-aud-aa1a', name: 'Kidist Mehari (Desk Auditor)',   email: 'kidist.mehari@mor.gov.et',     role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', teamLeader: 'u-tl-aa1a', password: 'password123' },
  { id: 'u-aud-aa1b', name: 'Robel Tadesse (Desk Auditor)',   email: 'robel.tadesse@mor.gov.et',     role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', teamLeader: 'u-tl-aa1a', password: 'password123' },
  { id: 'u-aud-aa1c', name: 'Natnael Kifle (Field Auditor)',   email: 'natnael.kifle@mor.gov.et',     role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', teamLeader: 'u-tl-aa1b', password: 'password123' },
  { id: 'u-aud-aa1d', name: 'Yodit Alemayehu (Field Auditor)', email: 'yodit.alemayehu@mor.gov.et',   role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', teamLeader: 'u-tl-aa1b', password: 'password123' },
  { id: 'u-aud-aa1e', name: 'Samuel Haile (Joint Auditor)',    email: 'samuel.haile@mor.gov.et',      role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', teamLeader: 'u-tl-aa1c', password: 'password123' },
  { id: 'u-aud-aa1f', name: 'Eden Tesfaye (Joint Auditor)',    email: 'eden.tesfaye@mor.gov.et',      role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', teamLeader: 'u-tl-aa1c', password: 'password123' },
  { id: 'u-aud-aa1g', name: 'Fikremariam B. (Comp Auditor)',  email: 'fikremariam.b@mor.gov.et',     role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', teamLeader: 'u-tl-aa1d', password: 'password123' },
  { id: 'u-aud-aa1h', name: 'Saron Getachew (Comp Auditor)',  email: 'saron.getachew@mor.gov.et',    role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', teamLeader: 'u-tl-aa1d', password: 'password123' },
  { id: 'u-aud-aa1i', name: 'Michael Desta (TP Auditor)',   email: 'michael.desta@mor.gov.et',     role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', teamLeader: 'u-tl-aa1e', auditType: 'transfer_pricing', password: 'password123' },
  { id: 'u-aud-aa1j', name: 'Eyerusalem M. (TP Auditor)',   email: 'eyerusalem.m@mor.gov.et',      role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', teamLeader: 'u-tl-aa1e', auditType: 'transfer_pricing', password: 'password123' },
  { id: 'u-aud-aa1k', name: 'Abdi Kedir (Issue Auditor)',      email: 'abdi.kedir@mor.gov.et',        role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', teamLeader: 'u-tl-aa1f', auditType: 'issue_audit',      password: 'password123' },
  { id: 'u-aud-aa1l', name: 'Mahlet Bekele (Issue Auditor)',   email: 'mahlet.bekele@mor.gov.et',     role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', teamLeader: 'u-tl-aa1f', auditType: 'issue_audit',      password: 'password123' },

  
  // Auditors — AA-TC2 (Multiple auditors per TL)
  { id: 'u-aud-aa2a', name: 'Meseret Hailu',   email: 'meseret.hailu@mor.gov.et',     role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc2', teamLeader: 'u-tl-aa2a', password: 'password123' },
  { id: 'u-aud-aa2b', name: 'Amanuel Girma',   email: 'amanuel.girma@mor.gov.et',     role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc2', teamLeader: 'u-tl-aa2a', password: 'password123' },
  { id: 'u-aud-aa2c', name: 'Ruth Berhane',    email: 'ruth.berhane@mor.gov.et',      role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc2', teamLeader: 'u-tl-aa2b', password: 'password123' },
  { id: 'u-aud-aa2d', name: 'Tesfaye Lemma',   email: 'tesfaye.lemma@mor.gov.et',     role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc2', teamLeader: 'u-tl-aa2b', password: 'password123' },
  { id: 'u-aud-aa2e', name: 'Fasika Tadesse',  email: 'fasika.tadesse@mor.gov.et',    role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc2', teamLeader: 'u-tl-aa2c', password: 'password123' },
  { id: 'u-aud-aa2f', name: 'Bereket Wolde',   email: 'bereket.wolde@mor.gov.et',     role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc2', teamLeader: 'u-tl-aa2c', password: 'password123' },
  { id: 'u-aud-aa2g', name: 'Helen Tesfaye',   email: 'helen.tesfaye@mor.gov.et',     role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc2', teamLeader: 'u-tl-aa2d', password: 'password123' },
  { id: 'u-aud-aa2h', name: 'Daniel Abera',    email: 'daniel.abera@mor.gov.et',      role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc2', teamLeader: 'u-tl-aa2d', password: 'password123' },
  { id: 'u-aud-aa2i', name: 'Meron Hailu',     email: 'meron.hailu@mor.gov.et',       role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc2', teamLeader: 'u-tl-aa2e', password: 'password123' },
  { id: 'u-aud-aa2j', name: 'Yared Bekele',    email: 'yared.bekele@mor.gov.et',      role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc2', teamLeader: 'u-tl-aa2e', password: 'password123' },
  
  // Auditors — AA-TC3 (Multiple auditors per TL)
  { id: 'u-aud-aa3a', name: 'Nardos Alemu',    email: 'nardos.alemu@mor.gov.et',      role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc3', teamLeader: 'u-tl-aa3a', password: 'password123' },
  { id: 'u-aud-aa3b', name: 'Addis Mekonnen',  email: 'addis.mekonnen@mor.gov.et',    role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc3', teamLeader: 'u-tl-aa3a', password: 'password123' },
  { id: 'u-aud-aa3c', name: 'Bethel Tadesse',  email: 'bethel.tadesse@mor.gov.et',    role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc3', teamLeader: 'u-tl-aa3b', password: 'password123' },
  { id: 'u-aud-aa3d', name: 'Dawit Negash',    email: 'dawit.negash@mor.gov.et',      role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc3', teamLeader: 'u-tl-aa3b', password: 'password123' },
  { id: 'u-aud-aa3e', name: 'Hirut Kebede',    email: 'hirut.kebede@mor.gov.et',      role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc3', teamLeader: 'u-tl-aa3c', password: 'password123' },
  { id: 'u-aud-aa3f', name: 'Kaleb Gebre',     email: 'kaleb.gebre@mor.gov.et',       role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc3', teamLeader: 'u-tl-aa3c', password: 'password123' },
  { id: 'u-aud-aa3g', name: 'Rahel Mulugeta',  email: 'rahel.mulugeta@mor.gov.et',    role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc3', teamLeader: 'u-tl-aa3d', password: 'password123' },
  { id: 'u-aud-aa3h', name: 'Yonatan Haile',   email: 'yonatan.haile@mor.gov.et',     role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc3', teamLeader: 'u-tl-aa3d', password: 'password123' },
  { id: 'u-aud-aa3i', name: 'Sofia Tesfaye',   email: 'sofia.tesfaye@mor.gov.et',     role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc3', teamLeader: 'u-tl-aa3e', password: 'password123' },
  { id: 'u-aud-aa3j', name: 'Abraham Girma',   email: 'abraham.girma@mor.gov.et',     role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc3', teamLeader: 'u-tl-aa3e', password: 'password123' },
  
  // Auditors — OR-TC1
  { id: 'u-aud-or1a', name: 'Tolera Banti',    email: 'tolera.banti@mor.gov.et',      role: 'auditor', region: 'oromia', taxCenter: 'oromia-tc1', teamLeader: 'u-tl-or1a', password: 'password123' },
  { id: 'u-aud-or1b', name: 'Chaltu Bekele',   email: 'chaltu.bekele@mor.gov.et',     role: 'auditor', region: 'oromia', taxCenter: 'oromia-tc1', teamLeader: 'u-tl-or1a', password: 'password123' },

  // Committee Members — Federal & AA Committees
  { id: 'u-com-fed-chair', name: 'Federal Joint Committee Chair', email: 'fed.committee1@mor.gov.et', role: 'committee_chair', region: 'federal_level', taxCenter: 'federal-lto1', auditType: 'joint_audit', password: 'password123' },
  { id: 'u-com-fed-tpchair',name: 'Federal TP Committee Chair',   email: 'fed.tpcommittee1@mor.gov.et', role: 'committee_chair', region: 'federal_level', taxCenter: 'federal-lto1', auditType: 'transfer_pricing', password: 'password123' },
  { id: 'u-com-aa-chair', name: 'Committee Chair AA (Joint)', email: 'aa.committee1@mor.gov.et',              role: 'committee_chair', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', auditType: 'joint_audit', password: 'password123' },
  { id: 'u-com-aa-tpchair',name: 'TP Committee Chair AA',       email: 'tp.committee1@mor.gov.et',              role: 'committee_chair', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', auditType: 'transfer_pricing', password: 'password123' },
  { id: 'u-com-aa-mem1',  name: 'Committee Member AA (2)',    email: 'aa-ara.joint_committee.2@mor.gov.et',   role: 'committee_member', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', auditType: 'joint_audit', password: 'password123' },
  { id: 'u-com-aa-mem2',  name: 'Committee Member AA (3)',    email: 'aa-ara.joint_committee.3@mor.gov.et',   role: 'committee_member', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', auditType: 'joint_audit', password: 'password123' },
  { id: 'u-com-aa-mem3',  name: 'Committee Member AA (4)',    email: 'aa-ara.joint_committee.4@mor.gov.et',   role: 'committee_member', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', auditType: 'joint_audit', password: 'password123' },
  { id: 'u-com-aa-mem4',  name: 'Committee Member AA (5)',    email: 'aa-ara.joint_committee.5@mor.gov.et',   role: 'committee_member', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', auditType: 'joint_audit', password: 'password123' },

  // Regional Joint Audit Committees
  { id: 'or1.chair', name: 'Dr. Chaltu Negash', email: 'or1.chair@mor.gov.et', role: 'committee_chair', region: 'oromia', taxCenter: 'oromia-tc1', auditType: 'joint_audit', password: 'password123' },
  { id: 'or1.member', name: 'Diriba Lema', email: 'or1.member@mor.gov.et', role: 'committee_member', region: 'oromia', taxCenter: 'oromia-tc1', auditType: 'joint_audit', password: 'password123' },
  { id: 'ba1.chair', name: 'Dr. Tadesse Kebede', email: 'ba1.chair@mor.gov.et', role: 'committee_chair', region: 'amhara', taxCenter: 'amhara-tc1', auditType: 'joint_audit', password: 'password123' },
  { id: 'ba1.member', name: 'Almaz Kassa', email: 'ba1.member@mor.gov.et', role: 'committee_member', region: 'amhara', taxCenter: 'amhara-tc1', auditType: 'joint_audit', password: 'password123' },
  { id: 'dd1.chair', name: 'Dr. Yonas Mengistu', email: 'dd1.chair@mor.gov.et', role: 'committee_chair', region: 'dire_dawa', taxCenter: 'dire_dawa-tc1', auditType: 'joint_audit', password: 'password123' },
  { id: 'dd1.member', name: 'Hassen Umer', email: 'dd1.member@mor.gov.et', role: 'committee_member', region: 'dire_dawa', taxCenter: 'dire_dawa-tc1', auditType: 'joint_audit', password: 'password123' },
  { id: 'sn1.chair', name: 'Dr. Tekle Lemma', email: 'sn1.chair@mor.gov.et', role: 'committee_chair', region: 'snnpr', taxCenter: 'snnpr-tc1', auditType: 'joint_audit', password: 'password123' },
  { id: 'sn1.member', name: 'Bereket Haile', email: 'sn1.member@mor.gov.et', role: 'committee_member', region: 'snnpr', taxCenter: 'snnpr-tc1', auditType: 'joint_audit', password: 'password123' },
  { id: 'so1.chair', name: 'Dr. Ibrahim Hassan', email: 'so1.chair@mor.gov.et', role: 'committee_chair', region: 'somali', taxCenter: 'somali-tc1', auditType: 'joint_audit', password: 'password123' },
  { id: 'so1.member', name: 'Fatuma Ahmed', email: 'so1.member@mor.gov.et', role: 'committee_member', region: 'somali', taxCenter: 'somali-tc1', auditType: 'joint_audit', password: 'password123' },

  // Canonical Database Users & Aliases
  { id: 'admin', name: 'System Administrator', email: 'admin@mor.gov.et', role: 'planning_team', region: 'federal_level', password: 'password123' },
  { id: 'taxpayer1', name: 'Crest Textiles CFO', email: 'cfo@cresttextiles.et', role: 'taxpayer', region: 'federal_level', password: 'password123' },

  // Canonical Tax Center Managers (matching DB u-tcm-{tc})
  { id: 'u-tcm-federal-lto2', name: 'Tirhas Gebre (Manager FED-LTO2)', email: 'u-tcm-federal-lto2@mor.gov.et', role: 'tax_center_manager', region: 'federal_level', taxCenter: 'federal-lto2', password: 'password123' },
  { id: 'u-tcm-addis_ababa-tc1', name: 'Mekdes Solomon (Manager AA-TC1)', email: 'u-tcm-addis_ababa-tc1@mor.gov.et', role: 'tax_center_manager', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', password: 'password123' },
  { id: 'u-tcm-addis_ababa-tc2', name: 'Dereje Worku (Manager AA-TC2)', email: 'u-tcm-addis_ababa-tc2@mor.gov.et', role: 'tax_center_manager', region: 'addis_ababa', taxCenter: 'addis_ababa-tc2', password: 'password123' },
  { id: 'u-tcm-addis_ababa-tc3', name: 'Selam Tekle (Manager AA-TC3)', email: 'u-tcm-addis_ababa-tc3@mor.gov.et', role: 'tax_center_manager', region: 'addis_ababa', taxCenter: 'addis_ababa-tc3', password: 'password123' },
  { id: 'u-tcm-oromia-tc1', name: 'Chaltu Girma (Manager OR-TC1)', email: 'u-tcm-oromia-tc1@mor.gov.et', role: 'tax_center_manager', region: 'oromia', taxCenter: 'oromia-tc1', password: 'password123' },

  // Canonical Team Leaders (matching DB u-tl-{tc}-{type}-{num})
  { id: 'u-tl-addis_ababa-tc1-desk-1', name: 'Henok Belay (Desk TL-1)', email: 'u-tl-addis_ababa-tc1-desk-1@mor.gov.et', role: 'team_leader', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', auditType: 'desk_audit', password: 'password123' },
  { id: 'u-tl-addis_ababa-tc1-desk-2', name: 'Abebe Bikila (Desk TL-2)', email: 'u-tl-addis_ababa-tc1-desk-2@mor.gov.et', role: 'team_leader', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', auditType: 'desk_audit', password: 'password123' },
  { id: 'u-tl-addis_ababa-tc1-comp-1', name: 'Seble Tesfaye (Comp TL-1)', email: 'u-tl-addis_ababa-tc1-comp-1@mor.gov.et', role: 'team_leader', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', auditType: 'comprehensive', password: 'password123' },
  { id: 'u-tl-addis_ababa-tc1-tp-1', name: 'Robel Girma (TP TL-1)', email: 'u-tl-addis_ababa-tc1-tp-1@mor.gov.et', role: 'team_leader', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', auditType: 'transfer_pricing', password: 'password123' },
  { id: 'u-tl-addis_ababa-tc1-joint-1', name: 'Melaku Bekele (Joint TL-1)', email: 'u-tl-addis_ababa-tc1-joint-1@mor.gov.et', role: 'team_leader', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', auditType: 'joint_audit', password: 'password123' },
  { id: 'u-tl-addis_ababa-tc1-issue-1', name: 'Sara Negash (Issue TL-1)', email: 'u-tl-addis_ababa-tc1-issue-1@mor.gov.et', role: 'team_leader', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', auditType: 'issue_audit', password: 'password123' },

  // Canonical Auditors (matching DB u-aud-{tc}-{type}-{tl}-{a})
  { id: 'u-aud-addis_ababa-tc1-desk-1-1', name: 'Kidist Mehari (Desk Aud-1)', email: 'u-aud-addis_ababa-tc1-desk-1-1@mor.gov.et', role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', auditType: 'desk_audit', teamLeader: 'u-tl-addis_ababa-tc1-desk-1', password: 'password123' },
  { id: 'u-aud-addis_ababa-tc1-desk-1-2', name: 'Robel Tadesse (Desk Aud-2)', email: 'u-aud-addis_ababa-tc1-desk-1-2@mor.gov.et', role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', auditType: 'desk_audit', teamLeader: 'u-tl-addis_ababa-tc1-desk-1', password: 'password123' },
  { id: 'u-aud-addis_ababa-tc1-tp-1-1', name: 'Michael Abera (TP Aud-1)', email: 'michael.abera@mor.gov.et', role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', auditType: 'transfer_pricing', teamLeader: 'u-tl-addis_ababa-tc1-tp-1', password: 'password123' },
  { id: 'u-aud-addis_ababa-tc1-tp-1-2', name: 'Mahlet Mideksa (TP Aud-2)', email: 'u-aud-addis_ababa-tc1-tp-1-2@mor.gov.et', role: 'auditor', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', auditType: 'transfer_pricing', teamLeader: 'u-tl-addis_ababa-tc1-tp-1', password: 'password123' },
  { id: 'u-tl-federal-lto1-comp-1', name: 'Mulugeta Tesfaye (Comp TL)', email: 'u-tl-federal-lto1-comp-1@mor.gov.et', role: 'team_leader', region: 'federal', taxCenter: 'federal-lto1', auditType: 'comprehensive', password: 'password123' },
  { id: 'u-aud-federal-lto1-comp-1-1', name: 'Seble Worku (Comp Auditor)', email: 'u-aud-federal-lto1-comp-1-1@mor.gov.et', role: 'auditor', region: 'federal', taxCenter: 'federal-lto1', auditType: 'comprehensive', teamLeader: 'u-tl-federal-lto1-comp-1', password: 'password123' },


  // Canonical Committees (matching DB u-com-{tc}-{type})
  { id: 'u-com-addis_ababa-tc1-ja', name: 'Joint Committee Chair (AA-TC1)', email: 'u-com-addis_ababa-tc1-ja@mor.gov.et', role: 'committee_chair', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', auditType: 'joint_audit', password: 'password123' },
  { id: 'u-com-addis_ababa-tc1-tp', name: 'TP Committee Chair (AA-TC1)', email: 'u-com-addis_ababa-tc1-tp@mor.gov.et', role: 'committee_chair', region: 'addis_ababa', taxCenter: 'addis_ababa-tc1', auditType: 'transfer_pricing', password: 'password123' },
  { id: 'u-com-fed-deskchair', name: 'Federal Desk Audit Committee Chair', email: 'fed.deskcommittee@mor.gov.et', role: 'committee_chair', region: 'federal_level', taxCenter: 'federal-lto1', auditType: 'desk_audit', password: 'password123' },
  { id: 'u-com-fed-compchair', name: 'Federal Comp Audit Committee Chair', email: 'fed.compcommittee@mor.gov.et', role: 'committee_chair', region: 'federal_level', taxCenter: 'federal-lto1', auditType: 'comprehensive', password: 'password123' },
  { id: 'u-com-fed-issuechair', name: 'Federal Issue Audit Committee Chair', email: 'fed.issuecommittee@mor.gov.et', role: 'committee_chair', region: 'federal_level', taxCenter: 'federal-lto1', auditType: 'issue_audit', password: 'password123' },
];

// ============================================================
// Deterministic distribution helper
// ============================================================
const buildDistribution = (regionWeights) => {
  // Weights updated to match 5 audit types (Field Audit removed)
  const weights = { desk_audit: 0.35, joint_audit: 0.25, transfer_pricing: 0.15, comprehensive: 0.15, issue_audit: 0.10 };
  const dist = {};
  for (const [regionId, total] of Object.entries(regionWeights)) {
    dist[regionId] = {};
    let remaining = total;
    const types = AUDIT_TYPES.map(a => a.id);
    types.forEach((id, idx) => {
      if (idx === types.length - 1) {
        dist[regionId][id] = remaining;
      } else {
        const count = Math.round(total * weights[id]);
        dist[regionId][id] = count;
        remaining -= count;
      }
    });
  }
  return dist;
};

const buildTaxCenterDistribution = (regionId, regionDist) => {
  if (!regionDist) return {}; // Safety check
  
  const tcs = TAX_CENTERS[regionId];
  if (!tcs || tcs.length === 0) return {}; // Safety check
  
  const tcDist = {};
  for (const tcWeights of [{ w: 0.40, idx: 0 }, { w: 0.35, idx: 1 }, { w: 0.25, idx: 2 }]) {
    const tc = tcs[tcWeights.idx];
    if (!tc) continue; // Skip if tax center doesn't exist
    
    tcDist[tc.id] = {};
    if (tcWeights.idx < 2) {
      AUDIT_TYPES.forEach(a => { 
        tcDist[tc.id][a.id] = Math.round((regionDist[a.id] || 0) * tcWeights.w); 
      });
    } else {
      AUDIT_TYPES.forEach(a => {
        const prev = (tcDist[tcs[0].id]?.[a.id] || 0) + (tcDist[tcs[1].id]?.[a.id] || 0);
        tcDist[tc.id][a.id] = (regionDist[a.id] || 0) - prev;
      });
    }
  }
  return tcDist;
};

// ============================================================
// SEED PLANS
// ============================================================
const makeTimeline = (entries) => entries.map(([status, actor, comment, daysAgo]) => ({
  status, actor, comment, timestamp: new Date(Date.now() - daysAgo * 86400000).toISOString(),
}));

const plan1Dist = buildDistribution({ addis_ababa: 350, amhara: 280, oromia: 320, snnpr: 250, somali: 200 });
const plan2Dist = buildDistribution({ addis_ababa: 400, amhara: 300, oromia: 350, snnpr: 280, somali: 220 });

const buildAllRegionalFeedback = (dist) => {
  const feedback = {};
  REGIONS.forEach(region => {
    feedback[region.id] = {
      feedback: `Region ${region.name} has reviewed the allocation. All tax centers are prepared to execute the plan within budget and staffing constraints.`,
      taxCenterAllocations: buildTaxCenterDistribution(region.id, dist[region.id]),
      submittedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      submittedBy: `u-rd-${region.id.split('_')[0]}`,
    };
  });
  return feedback;
};

export const SEED_PLANS = [];

// ============================================================
// CASE GENERATION - Using Real Taxpayer Data
// ============================================================

export const generateCases = (planId, dist, regionalFeedback = {}) => {
  const cases = [];

  for (const region of REGIONS) {
    const regionDist = dist[region.id] || {};
    const tcs = TAX_CENTERS[region.id] || [];
    const tcAllocations = regionalFeedback[region.id]?.taxCenterAllocations ?? null;

    for (const tc of tcs) {
      // Get allocation for this tax center
      let tcAllocation = {};
      
      if (tcAllocations && tcAllocations[tc.id]) {
        // Use regional feedback allocations
        tcAllocation = tcAllocations[tc.id];
      } else {
        // Distribute evenly among tax centers
        AUDIT_TYPES.forEach(auditType => {
          const totalForType = regionDist[auditType.id] || 0;
          const perTC = Math.floor(totalForType / tcs.length);
          tcAllocation[auditType.id] = perTC;
        });
      }

      // Generate cases for this tax center using real taxpayer data
      const tcCases = generateCasesFromPlan(planId, tc.id, tcAllocation, dist);
      cases.push(...tcCases);
    }
  }

  return cases;
};
