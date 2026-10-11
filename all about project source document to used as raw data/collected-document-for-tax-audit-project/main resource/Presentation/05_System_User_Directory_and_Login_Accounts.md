# ITAS Tax Audit System — Official User Directory & Login Credentials

**Generated Date:** October 2026 / Tikimt 2019 E.C.  
**Status:** Production-Ready Synchronized System Roster (BCrypt + 5-Attempt Lockout + Signed JWT)  
**Naming Convention:** Full Role Title Prefixes on Username and Email (`role-id` / `role.firstname.lastname@mor.gov.et`)  
**Default Password for all initial accounts:** `Mor@2026!` *(legacy `password123` is strictly disallowed; once a user changes their password, only their new custom password is accepted)*

> [!TIP]
> **Quick Login Instructions:**
> - You can log in using either the **Official Email** or the **Assigned System Username / Legacy Alias**.
> - Both the username/email and password are strictly validated by the backend (`POST /api/v1/backoffice/auth/login`). Any unrecognized username/email or wrong password returns `HTTP 401 Unauthorized` and displays an immediate `"Invalid username/email or password"` error on the Login screen.

---

## Quick-Reference Credentials (Key Roles Across All Clusters)

The following primary accounts cover every major role and audit cluster in the MOR Tax Audit System (Default Password: **`Mor@2026!`**):

| Role / Workspace | Login Email / Identifier | Alternative Username / Alias | Full Name | Audit Cluster / Scope | Default Password |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **🛡️ System Admin** | `admin@mor.gov.et` | `sysadmin-01` / `admin` | Dawit Solomon | National IT Security & User Administration | `Mor@2026!` |
| **🏅 QA Officer** | `qa.officer1@mor.gov.et` | `qa.officer1` / `u-qa-officer-1` | Rahel Tesfaye | ISO 19011 Quality Assurance Inspector | `Mor@2026!` |
| **🏅 QA Officer (2)** | `qa.officer2@mor.gov.et` | `qa.officer2` / `u-qa-officer-2` | Biniyam Girma | ISO 19011 Quality Assurance Inspector | `Mor@2026!` |
| **⭐ QA Team Leader** | `qa.tl1@mor.gov.et` | `qa.tl1` / `u-qa-tl-1` | Tewodros Mekonnen | QA Supervisory Review & Sampling | `Mor@2026!` |
| **🏛️ QA Director** | `qa.director@mor.gov.et` | `qa.director` / `u-qa-director-1` | Dr. Mesfin Alemayehu | Executive QA Governance & Sign-Off | `Mor@2026!` |
| **🏢 LTO1 Manager** | `taxcentermanager.tsega.mulugeta@mor.gov.et` | `u-tcm-federal-lto1` | Tsega Mulugeta | Federal LTO-1 Tax Center Manager | `Mor@2026!` |
| **📋 Desk TL (LTO1)** | `u-tl-federal-lto1-desk-1@mor.gov.et` | `u-tl-federal-lto1-desk-1` | Desk TL-1 (FED-LTO1) | Desk Audit Team Leader (Federal LTO-1) | `Mor@2026!` |
| **🔍 Desk Auditor** | `u-aud-federal-lto1-desk-1-1@mor.gov.et` | `u-aud-federal-lto1-desk-1-1` | Desk Aud-1 (TL-1, FED-LTO1) | Desk Audit Execution (Federal LTO-1) | `Mor@2026!` |
| **📊 Comp Auditor** | `u-aud-federal-lto1-comp-1-1@mor.gov.et` | `u-aud-federal-lto1-comp-1-1` | Seble Worku | Comprehensive Audit Execution (Federal LTO-1) | `Mor@2026!` |
| **⚖️ Joint TL (LTO2)** | `fed2.ja.tl@mor.gov.et` | `fed2.ja.tl` / `teamleader-federal-lto2-ja-1` | Berhanu Bekele | Joint Audit Team Leader (Federal LTO-2) | `Mor@2026!` |
| **⚖️ Joint Auditor** | `fed.ja.auditor1@mor.gov.et` | `fed.ja.auditor1` / `auditor-federal-lto1-ja-1` | Fikremariam Tilahun | Joint Audit Execution (Federal LTO-1) | `Mor@2026!` |
| **📐 Planning Team** | `planning.eden.haile@mor.gov.et` | `planning-01` / `u-pt-01` | Eden Haile | National Annual Audit Planning | `Mor@2026!` |
| **🏛️ Audit Director** | `director.getnet.bekele@mor.gov.et` | `director-01` / `u-ad-01` | Getnet Bekele | National Audit Directorate Approval | `Mor@2026!` |
| **👑 Senior Management** | `seniormanagement.almaz.berhane@mor.gov.et` | `seniormanagement-01` / `u-sm-01` | Almaz Berhane | Executive Plan Sanctioning | `Mor@2026!` |

---

## Executive Summary of User Counts

| Category / Role | Role Prefix | Total Accounts | Example Login Username | Example Login Email |
|---|---|---|---|---|
| System Administration | `sysadmin` | **1** | `sysadmin-01` | `admin@mor.gov.et` |
| Quality Assurance Directorate | `qa` | **4** | `qa.officer1` | `qa.officer1@mor.gov.et` |
| National Planning Team | `planning` | **3** | `planning-02` | `planning.samuel.worku@mor.gov.et` |
| National Audit Directorate | `director` | **2** | `director-02` | `director.gemechu.kebede@mor.gov.et` |
| Senior Executive Management | `seniormanagement` | **2** | `seniormanagement-01` | `seniormanagement.almaz.berhane@mor.gov.et` |
| Regional Directors | `regionaldirector` | **7** | `regionaldirector-aa` | `regionaldirector.getnet.alemu@mor.gov.et` |
| Statutory & External Audit Requesters | `auditrequester` | **4** | `auditrequester-01` | `auditrequester.getachew.zewde@mor.gov.et` |
| Tax Center Managers | `taxcentermanager` | **20** | `taxcentermanager-federal-lto1` | `taxcentermanager.tsega.mulugeta@mor.gov.et` |
| Joint Audit & TP Committee Chairpersons | `committeechair` | **26** | `committeechair-aa1` | `committeechair.abebe.kebede@mor.gov.et` |
| Joint Audit & TP Committee Members | `committeemember` | **32** | `committeemember-aa1` | `committeemember.fatuma.ahmed@mor.gov.et` |
| Audit Team Leaders | `teamleader` | **200** | `teamleader-aa1-1` | `teamleader.dawit.tadesse@mor.gov.et` |
| Audit Specialists & Auditors | `auditor` | **520** | `auditor-aa1-1` | `auditor.sara.mohammed@mor.gov.et` |
| **Grand Total** | - | **821** | - | - |

---

## 0A. System Administration (HQ Federal IT Security)

**Total Accounts:** 1  

| # | Username | Legacy Alias | Full Name | Official Login Email | Role / Stream | Assigned Location | Status |
|---|---|---|---|---|---|---|---|
| 1 | `sysadmin-01` | `admin` / `sys.admin` | Dawit Solomon | `admin@mor.gov.et` | SYSTEM_ADMIN | FEDERAL | ACTIVE |

---

## 0B. Quality Assurance Directorate (HQ Federal — ISO 19011 / SOR FR-04.5)

**Total Accounts:** 4  

| # | Username | Legacy Alias | Full Name | Official Login Email | Role / Stream | Assigned Location | Status |
|---|---|---|---|---|---|---|---|
| 1 | `qa.officer1` | `u-qa-officer-1` / `usr-qa-01` | Rahel Tesfaye | `qa.officer1@mor.gov.et` | QA_OFFICER | FEDERAL | ACTIVE |
| 2 | `qa.officer2` | `u-qa-officer-2` | Biniyam Girma | `qa.officer2@mor.gov.et` | QA_OFFICER | FEDERAL | ACTIVE |
| 3 | `qa.tl1` | `u-qa-tl-1` / `usr-qa-tl-01` | Tewodros Mekonnen | `qa.tl1@mor.gov.et` | QA_TEAM_LEADER | FEDERAL | ACTIVE |
| 4 | `qa.director` | `u-qa-director-1` / `usr-qa-dir-01` | Dr. Mesfin Alemayehu | `qa.director@mor.gov.et` | QA_DIRECTOR | FEDERAL | ACTIVE |

---

## 1. National Planning Team (HQ Federal)

**Total Accounts:** 3  

| # | Username | Full Name | Official Login Email | Role / Stream | Assigned Location | Status |
|---|---|---|---|---|---|---|
| 1 | `planning-01` | Eden Haile | `planning.eden.haile@mor.gov.et` | PLANNING_TEAM | FEDERAL | ACTIVE |
| 2 | `planning-02` | Samuel Worku | `planning.samuel.worku@mor.gov.et` | PLANNING_TEAM | FEDERAL | ACTIVE |
| 3 | `planning-03` | Yodit Kassa | `planning.yodit.kassa@mor.gov.et` | PLANNING_TEAM | FEDERAL | ACTIVE |

---

## 2. National Audit Directorate (HQ Federal)

**Total Accounts:** 2  

| # | Username | Full Name | Official Login Email | Role / Stream | Assigned Location | Status |
|---|---|---|---|---|---|---|
| 1 | `director-01` | Getnet Bekele | `director.getnet.bekele@mor.gov.et` | DIRECTOR | FEDERAL | ACTIVE |
| 2 | `director-02` | Gemechu Kebede | `director.gemechu.kebede@mor.gov.et` | DIRECTOR | FEDERAL | ACTIVE |

---

## 3. Senior Executive Management (HQ Federal)

**Total Accounts:** 2  

| # | Username | Full Name | Official Login Email | Role / Stream | Assigned Location | Status |
|---|---|---|---|---|---|---|
| 1 | `seniormanagement-01` | Almaz Berhane | `seniormanagement.almaz.berhane@mor.gov.et` | SENIOR_MANAGEMENT | FEDERAL | ACTIVE |
| 2 | `seniormanagement-02` | Workneh Wolde | `seniormanagement.workneh.wolde@mor.gov.et` | SENIOR_MANAGEMENT | FEDERAL | ACTIVE |

---

## 4. Regional Directors (Branch Directorates)

**Total Accounts:** 7  

| # | Username | Full Name | Official Login Email | Role / Stream | Assigned Location | Status |
|---|---|---|---|---|---|---|
| 1 | `regionaldirector-aa` | Getnet Alemu | `regionaldirector.getnet.alemu@mor.gov.et` | REGIONAL_DIRECTOR | AA | ACTIVE |
| 2 | `regionaldirector-am` | Tadesse Kebede | `regionaldirector.tadesse.kebede@mor.gov.et` | REGIONAL_DIRECTOR | BA | ACTIVE |
| 3 | `regionaldirector-dd` | Yonas Mengistu | `regionaldirector.yonas.mengistu@mor.gov.et` | REGIONAL_DIRECTOR | AB | ACTIVE |
| 4 | `regionaldirector-fed` | Berihun Lemma | `regionaldirector.berihun.lemma@mor.gov.et` | REGIONAL_DIRECTOR | FED | ACTIVE |
| 5 | `regionaldirector-or` | Gemechu Negash | `regionaldirector.gemechu.negash@mor.gov.et` | REGIONAL_DIRECTOR | BB | ACTIVE |
| 6 | `regionaldirector-sn` | Tekle Lemma | `regionaldirector.tekle.lemma@mor.gov.et` | REGIONAL_DIRECTOR | CA | ACTIVE |
| 7 | `regionaldirector-so` | Ibrahim Hassan | `regionaldirector.ibrahim.hassan@mor.gov.et` | REGIONAL_DIRECTOR | SO | ACTIVE |

---

## 5. Statutory & External Audit Requesters

**Total Accounts:** 4  

| # | Username | Full Name | Official Login Email | Role / Stream | Assigned Location | Status |
|---|---|---|---|---|---|---|
| 1 | `auditrequester-01` | Getachew Zewde | `auditrequester.getachew.zewde@mor.gov.et` | AUDIT_REQUESTER | FEDERAL | ACTIVE |
| 2 | `auditrequester-02` | Tigist Worku | `auditrequester.tigist.worku@mor.gov.et` | AUDIT_REQUESTER | FEDERAL | ACTIVE |
| 3 | `auditrequester-03` | Deriba Alemayehu | `auditrequester.deriba.alemayehu@mor.gov.et` | AUDIT_REQUESTER | FEDERAL | ACTIVE |
| 4 | `auditrequester-04` | Ibrahim Tesfa | `auditrequester.ibrahim.tesfa@mor.gov.et` | AUDIT_REQUESTER | FEDERAL | ACTIVE |

---

## 6. Tax Center Managers (18 Tax Centers)

**Total Accounts:** 20  

| # | Username | Full Name | Official Login Email | Role / Stream | Assigned Location | Status |
|---|---|---|---|---|---|---|
| 1 | `taxcentermanager-addis_ababa-tc1` | Mahlet Tesfa | `taxcentermanager.mahlet.tesfa@mor.gov.et` | TAX_CENTER_MANAGER | addis_ababa-tc1 | ACTIVE |
| 2 | `taxcentermanager-addis_ababa-tc2` | Tolera Alemu | `taxcentermanager.tolera.alemu@mor.gov.et` | TAX_CENTER_MANAGER | addis_ababa-tc2 | ACTIVE |
| 3 | `taxcentermanager-addis_ababa-tc3` | Diriba Bekele | `taxcentermanager.diriba.bekele@mor.gov.et` | TAX_CENTER_MANAGER | addis_ababa-tc3 | ACTIVE |
| 4 | `taxcentermanager-amhara-tc1` | Amanuel Haile | `taxcentermanager.amanuel.haile@mor.gov.et` | TAX_CENTER_MANAGER | amhara-tc1 | ACTIVE |
| 5 | `taxcentermanager-amhara-tc2` | Meseret Worku | `taxcentermanager.meseret.worku@mor.gov.et` | TAX_CENTER_MANAGER | amhara-tc2 | ACTIVE |
| 6 | `taxcentermanager-amhara-tc3` | Eden Kassa | `taxcentermanager.eden.kassa@mor.gov.et` | TAX_CENTER_MANAGER | amhara-tc3 | ACTIVE |
| 7 | `taxcentermanager-dire_dawa-tc1` | Almaz Kassa | `taxcentermanager.almaz.kassa@mor.gov.et` | TAX_CENTER_MANAGER | dire_dawa-tc1 | ACTIVE |
| 8 | `taxcentermanager-dire_dawa-tc2` | Workneh Mamo | `taxcentermanager.workneh.mamo@mor.gov.et` | TAX_CENTER_MANAGER | dire_dawa-tc2 | ACTIVE |
| 9 | `taxcentermanager-dire_dawa-tc3` | Tadesse Tadesse | `taxcentermanager.tadesse.tadesse@mor.gov.et` | TAX_CENTER_MANAGER | dire_dawa-tc3 | ACTIVE |
| 10 | `taxcentermanager-federal-lto1` | Tsega Mulugeta | `taxcentermanager.tsega.mulugeta@mor.gov.et` | TAX_CENTER_MANAGER | federal-lto1 | ACTIVE |
| 11 | `taxcentermanager-federal-lto2` | Berihun Tesfaye | `taxcentermanager.berihun.tesfaye@mor.gov.et` | TAX_CENTER_MANAGER | federal-lto2 | ACTIVE |
| 12 | `taxcentermanager-oromia-tc1` | Ibrahim Mekonnen | `taxcentermanager.ibrahim.mekonnen@mor.gov.et` | TAX_CENTER_MANAGER | oromia-tc1 | ACTIVE |
| 13 | `taxcentermanager-oromia-tc2` | Yonas Tilahun | `taxcentermanager.yonas.tilahun@mor.gov.et` | TAX_CENTER_MANAGER | oromia-tc2 | ACTIVE |
| 14 | `taxcentermanager-oromia-tc3` | Chaltu Assefa | `taxcentermanager.chaltu.assefa@mor.gov.et` | TAX_CENTER_MANAGER | oromia-tc3 | ACTIVE |
| 15 | `taxcentermanager-snnpr-tc1` | Rahel Gebre | `taxcentermanager.rahel.gebre@mor.gov.et` | TAX_CENTER_MANAGER | snnpr-tc1 | ACTIVE |
| 16 | `taxcentermanager-snnpr-tc2` | Mulugeta Lemma | `taxcentermanager.mulugeta.lemma@mor.gov.et` | TAX_CENTER_MANAGER | snnpr-tc2 | ACTIVE |
| 17 | `taxcentermanager-snnpr-tc3` | Diriba Mulugeta | `taxcentermanager.diriba.mulugeta@mor.gov.et` | TAX_CENTER_MANAGER | snnpr-tc3 | ACTIVE |
| 18 | `taxcentermanager-somali-tc1` | Chaltu Assefa | `taxcentermanager.chaltu.assefa2@mor.gov.et` | TAX_CENTER_MANAGER | somali-tc1 | ACTIVE |
| 19 | `taxcentermanager-somali-tc2` | Yonas Tilahun | `taxcentermanager.yonas.tilahun2@mor.gov.et` | TAX_CENTER_MANAGER | somali-tc2 | ACTIVE |
| 20 | `taxcentermanager-somali-tc3` | Ibrahim Mekonnen | `taxcentermanager.ibrahim.mekonnen2@mor.gov.et` | TAX_CENTER_MANAGER | somali-tc3 | ACTIVE |

---

## 7. Joint Audit & TP Committee Chairpersons

**Total Accounts:** 26  

| # | Username | Full Name | Official Login Email | Role / Stream | Assigned Location | Status |
|---|---|---|---|---|---|---|
| 1 | `committee-aa-tpchair` | Abebe Yohannes | `committeechair.abebe.yohannes@mor.gov.et` | TRANSFER_PRICING | addis_ababa-tc1 | ACTIVE |
| 2 | `committee-addis_ababa-tc2-ja` | Nardos Mamo | `committeechair.nardos.mamo@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc2 | ACTIVE |
| 3 | `committee-addis_ababa-tc3-ja` | Ephrem Tesfaye | `committeechair.ephrem.tesfaye@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc3 | ACTIVE |
| 4 | `committee-amhara-tc2-ja` | Robel Haile | `committeechair.robel.haile@mor.gov.et` | JOINT_AUDIT | amhara-tc2 | ACTIVE |
| 5 | `committee-amhara-tc3-ja` | Bikila Assefa | `committeechair.bikila.assefa@mor.gov.et` | JOINT_AUDIT | amhara-tc3 | ACTIVE |
| 6 | `committee-dire_dawa-tc2-ja` | Mulugeta Kebede | `committeechair.mulugeta.kebede@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc2 | ACTIVE |
| 7 | `committee-dire_dawa-tc3-ja` | Lalisa Hassan | `committeechair.lalisa.hassan@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc3 | ACTIVE |
| 8 | `committee-fed-chair` | Nardos Belay | `committeechair.nardos.belay@mor.gov.et` | JOINT_AUDIT | FEDERAL | ACTIVE |
| 9 | `committee-fed-compchair` | Mamo Bekele | `committeechair.mamo.bekele@mor.gov.et` | COMPREHENSIVE_AUDIT | FEDERAL | ACTIVE |
| 10 | `committee-fed-deskchair` | Tigist Alemu | `committeechair.tigist.alemu@mor.gov.et` | DESK_AUDIT | FEDERAL | ACTIVE |
| 11 | `committee-fed-issuechair` | Kassahun Assefa | `committeechair.kassahun.assefa@mor.gov.et` | ISSUE_AUDIT | FEDERAL | ACTIVE |
| 12 | `committee-fed-tpchair` | Fikadu Belay | `committeechair.fikadu.belay@mor.gov.et` | TRANSFER_PRICING | FEDERAL | ACTIVE |
| 13 | `committee-oromia-tc2-ja` | Ruth Hassan | `committeechair.ruth.hassan@mor.gov.et` | JOINT_AUDIT | oromia-tc2 | ACTIVE |
| 14 | `committee-oromia-tc3-ja` | Selam Kebede | `committeechair.selam.kebede@mor.gov.et` | JOINT_AUDIT | oromia-tc3 | ACTIVE |
| 15 | `committee-snnpr-tc2-ja` | Fikadu Mekonnen | `committeechair.fikadu.mekonnen@mor.gov.et` | JOINT_AUDIT | snnpr-tc2 | ACTIVE |
| 16 | `committee-snnpr-tc3-ja` | Almaz Yohannes | `committeechair.almaz.yohannes@mor.gov.et` | JOINT_AUDIT | snnpr-tc3 | ACTIVE |
| 17 | `committee-somali-tc2-ja` | Lalisa Negash | `committeechair.lalisa.negash@mor.gov.et` | JOINT_AUDIT | somali-tc2 | ACTIVE |
| 18 | `committee-somali-tc3-ja` | Mulugeta Abera | `committeechair.mulugeta.abera@mor.gov.et` | JOINT_AUDIT | somali-tc3 | ACTIVE |
| 19 | `committeechair-aa1` | Dr. Abebe Kebede | `committeechair.abebe.kebede@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc1 | ACTIVE |
| 20 | `committeechair-am1` | Dr. Tadesse Kebede | `committeechair.tadesse.kebede@mor.gov.et` | JOINT_AUDIT | amhara-tc1 | ACTIVE |
| 21 | `committeechair-dd1` | Dr. Yonas Mengistu | `committeechair.yonas.mengistu@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc1 | ACTIVE |
| 22 | `committeechair-federal-lto1-ja` | Dr. Solomon Desta | `committeechair.solomon.desta@mor.gov.et` | JOINT_AUDIT | federal-lto1 | ACTIVE |
| 23 | `committeechair-federal-lto2-ja` | Dr. Worku Alemayehu | `committeechair.worku.alemayehu@mor.gov.et` | JOINT_AUDIT | federal-lto2 | ACTIVE |
| 24 | `committeechair-or1` | Dr. Chaltu Negash | `committeechair.chaltu.negash@mor.gov.et` | JOINT_AUDIT | oromia-tc1 | ACTIVE |
| 25 | `committeechair-sn1` | Dr. Tekle Lemma | `committeechair.tekle.lemma@mor.gov.et` | JOINT_AUDIT | snnpr-tc1 | ACTIVE |
| 26 | `committeechair-so1` | Dr. Ibrahim Hassan | `committeechair.ibrahim.hassan@mor.gov.et` | JOINT_AUDIT | somali-tc1 | ACTIVE |

---

## 8. Joint Audit & TP Committee Members

**Total Accounts:** 32  

| # | Username | Full Name | Official Login Email | Role / Stream | Assigned Location | Status |
|---|---|---|---|---|---|---|
| 1 | `committee-addis_ababa-tc1-tp` | Haile Wolde | `committeemember.haile.wolde@mor.gov.et` | TRANSFER_PRICING | addis_ababa-tc1 | ACTIVE |
| 2 | `committee-addis_ababa-tc2-tp` | Yodit Mengistu | `committeemember.yodit.mengistu@mor.gov.et` | TRANSFER_PRICING | addis_ababa-tc2 | ACTIVE |
| 3 | `committee-addis_ababa-tc3-tp` | Bikila Bekele | `committeemember.bikila.bekele@mor.gov.et` | TRANSFER_PRICING | addis_ababa-tc3 | ACTIVE |
| 4 | `committee-amhara-tc1-tp` | Almaz Alemu | `committeemember.almaz.alemu@mor.gov.et` | TRANSFER_PRICING | amhara-tc1 | ACTIVE |
| 5 | `committee-amhara-tc2-tp` | Yosef Wakjira | `committeemember.yosef.wakjira@mor.gov.et` | TRANSFER_PRICING | amhara-tc2 | ACTIVE |
| 6 | `committee-amhara-tc3-tp` | Ephrem Abera | `committeemember.ephrem.abera@mor.gov.et` | TRANSFER_PRICING | amhara-tc3 | ACTIVE |
| 7 | `committee-dire_dawa-tc1-tp` | Yonas Kifle | `committeemember.yonas.kifle@mor.gov.et` | TRANSFER_PRICING | dire_dawa-tc1 | ACTIVE |
| 8 | `committee-dire_dawa-tc2-tp` | Eyerusalem Mulugeta | `committeemember.eyerusalem.mulugeta@mor.gov.et` | TRANSFER_PRICING | dire_dawa-tc2 | ACTIVE |
| 9 | `committee-dire_dawa-tc3-tp` | Fatuma Kassa | `committeemember.fatuma.kassa@mor.gov.et` | TRANSFER_PRICING | dire_dawa-tc3 | ACTIVE |
| 10 | `committee-fed-compmem1` | Kassa Kebede | `committeemember.kassa.kebede@mor.gov.et` | COMPREHENSIVE_AUDIT | FEDERAL | ACTIVE |
| 11 | `committee-fed-deskmem1` | Ephrem Bekele | `committeemember.ephrem.bekele@mor.gov.et` | DESK_AUDIT | FEDERAL | ACTIVE |
| 12 | `committee-fed-issuemem1` | Fatuma Tilahun | `committeemember.fatuma.tilahun@mor.gov.et` | ISSUE_AUDIT | FEDERAL | ACTIVE |
| 13 | `committee-fed-mem1` | Fatuma Abera | `committeemember.fatuma.abera@mor.gov.et` | JOINT_AUDIT | FEDERAL | ACTIVE |
| 14 | `committee-fed-mem2` | Kassahun Desta | `committeemember.kassahun.desta@mor.gov.et` | JOINT_AUDIT | FEDERAL | ACTIVE |
| 15 | `committee-fed-tpmem1` | Dereje Kebede | `committeemember.dereje.kebede@mor.gov.et` | TRANSFER_PRICING | FEDERAL | ACTIVE |
| 16 | `committee-fed-tpmem2` | Ruth Tadesse | `committeemember.ruth.tadesse@mor.gov.et` | TRANSFER_PRICING | FEDERAL | ACTIVE |
| 17 | `committee-federal-lto1-tp` | Natnael Bekele | `committeemember.natnael.bekele@mor.gov.et` | TRANSFER_PRICING | federal-lto1 | ACTIVE |
| 18 | `committee-federal-lto2-tp` | Kassa Tadesse | `committeemember.kassa.tadesse@mor.gov.et` | TRANSFER_PRICING | federal-lto2 | ACTIVE |
| 19 | `committee-oromia-tc1-tp` | Chaltu Belay | `committeemember.chaltu.belay@mor.gov.et` | TRANSFER_PRICING | oromia-tc1 | ACTIVE |
| 20 | `committee-oromia-tc2-tp` | Michael Zewde | `committeemember.michael.zewde@mor.gov.et` | TRANSFER_PRICING | oromia-tc2 | ACTIVE |
| 21 | `committee-oromia-tc3-tp` | Ibrahim Wolde | `committeemember.ibrahim.wolde@mor.gov.et` | TRANSFER_PRICING | oromia-tc3 | ACTIVE |
| 22 | `committee-snnpr-tc1-tp` | Rahel Alemayehu | `committeemember.rahel.alemayehu@mor.gov.et` | TRANSFER_PRICING | snnpr-tc1 | ACTIVE |
| 23 | `committee-snnpr-tc2-tp` | Birtukan Lemma | `committeemember.birtukan.lemma@mor.gov.et` | TRANSFER_PRICING | snnpr-tc2 | ACTIVE |
| 24 | `committee-snnpr-tc3-tp` | Tsega Worku | `committeemember.tsega.worku@mor.gov.et` | TRANSFER_PRICING | snnpr-tc3 | ACTIVE |
| 25 | `committee-somali-tc1-tp` | Workneh Alemayehu | `committeemember.workneh.alemayehu@mor.gov.et` | TRANSFER_PRICING | somali-tc1 | ACTIVE |
| 26 | `committee-somali-tc2-tp` | Sara Getachew | `committeemember.sara.getachew@mor.gov.et` | TRANSFER_PRICING | somali-tc2 | ACTIVE |
| 27 | `committee-somali-tc3-tp` | Almaw Assefa | `committeemember.almaw.assefa@mor.gov.et` | TRANSFER_PRICING | somali-tc3 | ACTIVE |
| 28 | `committeemember-aa1` | Fatuma Ahmed | `committeemember.fatuma.ahmed@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc1 | ACTIVE |
| 29 | `committeemember-am1` | Almaz Kassa | `committeemember.almaz.kassa@mor.gov.et` | JOINT_AUDIT | amhara-tc1 | ACTIVE |
| 30 | `committeemember-federal-lto1-ja` | Eleni Tesfaye | `committeemember.eleni.tesfaye@mor.gov.et` | JOINT_AUDIT | federal-lto1 | ACTIVE |
| 31 | `committeemember-federal-lto2-ja` | Tigist Hailu | `committeemember.tigist.hailu@mor.gov.et` | JOINT_AUDIT | federal-lto2 | ACTIVE |
| 32 | `committeemember-or1` | Diriba Lema | `committeemember.diriba.lema@mor.gov.et` | JOINT_AUDIT | oromia-tc1 | ACTIVE |

---

## 9. Audit Team Leaders (By Location & Audit Stream)

**Total Accounts:** 200  

| # | Username | Full Name | Official Login Email | Role / Stream | Assigned Location | Status |
|---|---|---|---|---|---|---|
| 1 | `teamleader-aa1-1` | Dawit Tadesse | `teamleader.dawit.tadesse@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc1 | ACTIVE |
| 2 | `teamleader-aa1-2` | Robel Girma | `teamleader.robel.girma@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc1 | ACTIVE |
| 3 | `teamleader-addis_ababa-tc1-comp-1` | Rahel Wakjira | `teamleader.rahel.wakjira@mor.gov.et` | COMPREHENSIVE_AUDIT | addis_ababa-tc1 | ACTIVE |
| 4 | `teamleader-addis_ababa-tc1-comp-2` | Berihun Mengistu | `teamleader.berihun.mengistu@mor.gov.et` | COMPREHENSIVE_AUDIT | addis_ababa-tc1 | ACTIVE |
| 5 | `teamleader-addis_ababa-tc1-desk-1` | Abdi Alemayehu | `teamleader.abdi.alemayehu@mor.gov.et` | DESK_AUDIT | addis_ababa-tc1 | ACTIVE |
| 6 | `teamleader-addis_ababa-tc1-desk-2` | Hassen Banti | `teamleader.hassen.banti@mor.gov.et` | DESK_AUDIT | addis_ababa-tc1 | ACTIVE |
| 7 | `teamleader-addis_ababa-tc1-issue-1` | Mesfin Mideksa | `teamleader.mesfin.mideksa@mor.gov.et` | ISSUE_AUDIT | addis_ababa-tc1 | ACTIVE |
| 8 | `teamleader-addis_ababa-tc1-issue-2` | Fikremariam Getachew | `teamleader.fikremariam.getachew@mor.gov.et` | ISSUE_AUDIT | addis_ababa-tc1 | ACTIVE |
| 9 | `teamleader-addis_ababa-tc1-tp-1` | Robel Girma | `teamleader.robel.girma2@mor.gov.et` | TRANSFER_PRICING | addis_ababa-tc1 | ACTIVE |
| 10 | `teamleader-addis_ababa-tc1-tp-2` | Natnael Belay | `teamleader.natnael.belay@mor.gov.et` | TRANSFER_PRICING | addis_ababa-tc1 | ACTIVE |
| 11 | `teamleader-addis_ababa-tc2-comp-1` | Bethlehem Tilahun | `teamleader.bethlehem.tilahun@mor.gov.et` | COMPREHENSIVE_AUDIT | addis_ababa-tc2 | ACTIVE |
| 12 | `teamleader-addis_ababa-tc2-comp-2` | Fikadu Mekonnen | `teamleader.fikadu.mekonnen@mor.gov.et` | COMPREHENSIVE_AUDIT | addis_ababa-tc2 | ACTIVE |
| 13 | `teamleader-addis_ababa-tc2-desk-1` | Tirhas Girma | `teamleader.tirhas.girma@mor.gov.et` | DESK_AUDIT | addis_ababa-tc2 | ACTIVE |
| 14 | `teamleader-addis_ababa-tc2-desk-2` | Kassahun Assefa | `teamleader.kassahun.assefa2@mor.gov.et` | DESK_AUDIT | addis_ababa-tc2 | ACTIVE |
| 15 | `teamleader-addis_ababa-tc2-issue-1` | Tekle Haile | `teamleader.tekle.haile@mor.gov.et` | ISSUE_AUDIT | addis_ababa-tc2 | ACTIVE |
| 16 | `teamleader-addis_ababa-tc2-issue-2` | Bikila Worku | `teamleader.bikila.worku@mor.gov.et` | ISSUE_AUDIT | addis_ababa-tc2 | ACTIVE |
| 17 | `teamleader-addis_ababa-tc2-joint-1` | Mekdes Wolde | `teamleader.mekdes.wolde@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc2 | ACTIVE |
| 18 | `teamleader-addis_ababa-tc2-joint-2` | Tirhas Abera | `teamleader.tirhas.abera@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc2 | ACTIVE |
| 19 | `teamleader-addis_ababa-tc2-tp-1` | Mamo Bekele | `teamleader.mamo.bekele2@mor.gov.et` | TRANSFER_PRICING | addis_ababa-tc2 | ACTIVE |
| 20 | `teamleader-addis_ababa-tc2-tp-2` | Kassa Kebede | `teamleader.kassa.kebede2@mor.gov.et` | TRANSFER_PRICING | addis_ababa-tc2 | ACTIVE |
| 21 | `teamleader-addis_ababa-tc3-comp-1` | Diriba Mamo | `teamleader.diriba.mamo@mor.gov.et` | COMPREHENSIVE_AUDIT | addis_ababa-tc3 | ACTIVE |
| 22 | `teamleader-addis_ababa-tc3-comp-2` | Mulugeta Kassa | `teamleader.mulugeta.kassa@mor.gov.et` | COMPREHENSIVE_AUDIT | addis_ababa-tc3 | ACTIVE |
| 23 | `teamleader-addis_ababa-tc3-desk-1` | Tigist Belay | `teamleader.tigist.belay@mor.gov.et` | DESK_AUDIT | addis_ababa-tc3 | ACTIVE |
| 24 | `teamleader-addis_ababa-tc3-desk-2` | Ephrem Tadesse | `teamleader.ephrem.tadesse@mor.gov.et` | DESK_AUDIT | addis_ababa-tc3 | ACTIVE |
| 25 | `teamleader-addis_ababa-tc3-issue-1` | Saron Desta | `teamleader.saron.desta@mor.gov.et` | ISSUE_AUDIT | addis_ababa-tc3 | ACTIVE |
| 26 | `teamleader-addis_ababa-tc3-issue-2` | Michael Kifle | `teamleader.michael.kifle@mor.gov.et` | ISSUE_AUDIT | addis_ababa-tc3 | ACTIVE |
| 27 | `teamleader-addis_ababa-tc3-joint-1` | Tirhas Alemu | `teamleader.tirhas.alemu@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc3 | ACTIVE |
| 28 | `teamleader-addis_ababa-tc3-joint-2` | Kassahun Tesfa | `teamleader.kassahun.tesfa@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc3 | ACTIVE |
| 29 | `teamleader-addis_ababa-tc3-tp-1` | Addis Yohannes | `teamleader.addis.yohannes2@mor.gov.et` | TRANSFER_PRICING | addis_ababa-tc3 | ACTIVE |
| 30 | `teamleader-addis_ababa-tc3-tp-2` | Kidist Mideksa | `teamleader.kidist.mideksa2@mor.gov.et` | TRANSFER_PRICING | addis_ababa-tc3 | ACTIVE |
| 31 | `teamleader-amhara-tc1-comp-1` | Eleni Kassa | `teamleader.eleni.kassa@mor.gov.et` | COMPREHENSIVE_AUDIT | amhara-tc1 | ACTIVE |
| 32 | `teamleader-amhara-tc1-comp-2` | Yosef Mamo | `teamleader.yosef.mamo@mor.gov.et` | COMPREHENSIVE_AUDIT | amhara-tc1 | ACTIVE |
| 33 | `teamleader-amhara-tc1-desk-1` | Dereje Haile | `teamleader.dereje.haile@mor.gov.et` | DESK_AUDIT | amhara-tc1 | ACTIVE |
| 34 | `teamleader-amhara-tc1-desk-2` | Mekdes Worku | `teamleader.mekdes.worku@mor.gov.et` | DESK_AUDIT | amhara-tc1 | ACTIVE |
| 35 | `teamleader-amhara-tc1-issue-1` | Michael Abera | `teamleader.michael.abera2@mor.gov.et` | ISSUE_AUDIT | amhara-tc1 | ACTIVE |
| 36 | `teamleader-amhara-tc1-issue-2` | Eyerusalem Wolde | `teamleader.eyerusalem.wolde2@mor.gov.et` | ISSUE_AUDIT | amhara-tc1 | ACTIVE |
| 37 | `teamleader-amhara-tc1-joint-1` | Nardos Worku | `teamleader.nardos.worku@mor.gov.et` | JOINT_AUDIT | amhara-tc1 | ACTIVE |
| 38 | `teamleader-amhara-tc1-joint-2` | Addis Haile | `teamleader.addis.haile@mor.gov.et` | JOINT_AUDIT | amhara-tc1 | ACTIVE |
| 39 | `teamleader-amhara-tc1-tp-1` | Mahlet Worku | `teamleader.mahlet.worku@mor.gov.et` | TRANSFER_PRICING | amhara-tc1 | ACTIVE |
| 40 | `teamleader-amhara-tc1-tp-2` | Abdi Kassa | `teamleader.abdi.kassa@mor.gov.et` | TRANSFER_PRICING | amhara-tc1 | ACTIVE |
| 41 | `teamleader-amhara-tc2-comp-1` | Mahlet Mekonnen | `teamleader.mahlet.mekonnen@mor.gov.et` | COMPREHENSIVE_AUDIT | amhara-tc2 | ACTIVE |
| 42 | `teamleader-amhara-tc2-comp-2` | Tolera Tilahun | `teamleader.tolera.tilahun@mor.gov.et` | COMPREHENSIVE_AUDIT | amhara-tc2 | ACTIVE |
| 43 | `teamleader-amhara-tc2-desk-1` | Workneh Bekele | `teamleader.workneh.bekele@mor.gov.et` | DESK_AUDIT | amhara-tc2 | ACTIVE |
| 44 | `teamleader-amhara-tc2-desk-2` | Almaz Kebede | `teamleader.almaz.kebede@mor.gov.et` | DESK_AUDIT | amhara-tc2 | ACTIVE |
| 45 | `teamleader-amhara-tc2-issue-1` | Mamo Desta | `teamleader.mamo.desta@mor.gov.et` | ISSUE_AUDIT | amhara-tc2 | ACTIVE |
| 46 | `teamleader-amhara-tc2-issue-2` | Hassen Berhane | `teamleader.hassen.berhane@mor.gov.et` | ISSUE_AUDIT | amhara-tc2 | ACTIVE |
| 47 | `teamleader-amhara-tc2-joint-1` | Fatuma Getachew | `teamleader.fatuma.getachew@mor.gov.et` | JOINT_AUDIT | amhara-tc2 | ACTIVE |
| 48 | `teamleader-amhara-tc2-joint-2` | Chaltu Mideksa | `teamleader.chaltu.mideksa@mor.gov.et` | JOINT_AUDIT | amhara-tc2 | ACTIVE |
| 49 | `teamleader-amhara-tc2-tp-1` | Tirhas Tesfaye | `teamleader.tirhas.tesfaye@mor.gov.et` | TRANSFER_PRICING | amhara-tc2 | ACTIVE |
| 50 | `teamleader-amhara-tc2-tp-2` | Kassahun Bikila | `teamleader.kassahun.bikila@mor.gov.et` | TRANSFER_PRICING | amhara-tc2 | ACTIVE |
| 51 | `teamleader-amhara-tc3-comp-1` | Addis Mengistu | `teamleader.addis.mengistu@mor.gov.et` | COMPREHENSIVE_AUDIT | amhara-tc3 | ACTIVE |
| 52 | `teamleader-amhara-tc3-comp-2` | Nardos Wakjira | `teamleader.nardos.wakjira@mor.gov.et` | COMPREHENSIVE_AUDIT | amhara-tc3 | ACTIVE |
| 53 | `teamleader-amhara-tc3-desk-1` | Birtukan Yohannes | `teamleader.birtukan.yohannes@mor.gov.et` | DESK_AUDIT | amhara-tc3 | ACTIVE |
| 54 | `teamleader-amhara-tc3-desk-2` | Lalisa Hassan | `teamleader.lalisa.hassan@mor.gov.et` | DESK_AUDIT | amhara-tc3 | ACTIVE |
| 55 | `teamleader-amhara-tc3-issue-1` | Abdi Haile | `teamleader.abdi.haile@mor.gov.et` | ISSUE_AUDIT | amhara-tc3 | ACTIVE |
| 56 | `teamleader-amhara-tc3-issue-2` | Mahlet Negash | `teamleader.mahlet.negash@mor.gov.et` | ISSUE_AUDIT | amhara-tc3 | ACTIVE |
| 57 | `teamleader-amhara-tc3-joint-1` | Kidist Mekonnen | `teamleader.kidist.mekonnen@mor.gov.et` | JOINT_AUDIT | amhara-tc3 | ACTIVE |
| 58 | `teamleader-amhara-tc3-joint-2` | Robel Tilahun | `teamleader.robel.tilahun@mor.gov.et` | JOINT_AUDIT | amhara-tc3 | ACTIVE |
| 59 | `teamleader-amhara-tc3-tp-1` | Diriba Wolde | `teamleader.diriba.wolde@mor.gov.et` | TRANSFER_PRICING | amhara-tc3 | ACTIVE |
| 60 | `teamleader-amhara-tc3-tp-2` | Tolera Abera | `teamleader.tolera.abera@mor.gov.et` | TRANSFER_PRICING | amhara-tc3 | ACTIVE |
| 61 | `teamleader-dire_dawa-tc1-comp-1` | Eleni Tadesse | `teamleader.eleni.tadesse@mor.gov.et` | COMPREHENSIVE_AUDIT | dire_dawa-tc1 | ACTIVE |
| 62 | `teamleader-dire_dawa-tc1-comp-2` | Yosef Belay | `teamleader.yosef.belay@mor.gov.et` | COMPREHENSIVE_AUDIT | dire_dawa-tc1 | ACTIVE |
| 63 | `teamleader-dire_dawa-tc1-desk-1` | Dereje Kassa | `teamleader.dereje.kassa@mor.gov.et` | DESK_AUDIT | dire_dawa-tc1 | ACTIVE |
| 64 | `teamleader-dire_dawa-tc1-desk-2` | Mekdes Mamo | `teamleader.mekdes.mamo@mor.gov.et` | DESK_AUDIT | dire_dawa-tc1 | ACTIVE |
| 65 | `teamleader-dire_dawa-tc1-issue-1` | Michael Lemma | `teamleader.michael.lemma@mor.gov.et` | ISSUE_AUDIT | dire_dawa-tc1 | ACTIVE |
| 66 | `teamleader-dire_dawa-tc1-issue-2` | Eyerusalem Gebre | `teamleader.eyerusalem.gebre@mor.gov.et` | ISSUE_AUDIT | dire_dawa-tc1 | ACTIVE |
| 67 | `teamleader-dire_dawa-tc1-joint-1` | Nardos Mamo | `teamleader.nardos.mamo@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc1 | ACTIVE |
| 68 | `teamleader-dire_dawa-tc1-joint-2` | Addis Kassa | `teamleader.addis.kassa@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc1 | ACTIVE |
| 69 | `teamleader-dire_dawa-tc1-tp-1` | Mahlet Desta | `teamleader.mahlet.desta@mor.gov.et` | TRANSFER_PRICING | dire_dawa-tc1 | ACTIVE |
| 70 | `teamleader-dire_dawa-tc1-tp-2` | Abdi Berhane | `teamleader.abdi.berhane@mor.gov.et` | TRANSFER_PRICING | dire_dawa-tc1 | ACTIVE |
| 71 | `teamleader-dire_dawa-tc2-comp-1` | Mahlet Assefa | `teamleader.mahlet.assefa@mor.gov.et` | COMPREHENSIVE_AUDIT | dire_dawa-tc2 | ACTIVE |
| 72 | `teamleader-dire_dawa-tc2-comp-2` | Tolera Girma | `teamleader.tolera.girma@mor.gov.et` | COMPREHENSIVE_AUDIT | dire_dawa-tc2 | ACTIVE |
| 73 | `teamleader-dire_dawa-tc2-desk-1` | Workneh Mekonnen | `teamleader.workneh.mekonnen@mor.gov.et` | DESK_AUDIT | dire_dawa-tc2 | ACTIVE |
| 74 | `teamleader-dire_dawa-tc2-desk-2` | Almaz Tilahun | `teamleader.almaz.tilahun@mor.gov.et` | DESK_AUDIT | dire_dawa-tc2 | ACTIVE |
| 75 | `teamleader-dire_dawa-tc2-issue-1` | Mamo Alemayehu | `teamleader.mamo.alemayehu@mor.gov.et` | ISSUE_AUDIT | dire_dawa-tc2 | ACTIVE |
| 76 | `teamleader-dire_dawa-tc2-issue-2` | Hassen Kifle | `teamleader.hassen.kifle@mor.gov.et` | ISSUE_AUDIT | dire_dawa-tc2 | ACTIVE |
| 77 | `teamleader-dire_dawa-tc2-joint-1` | Fatuma Alemu | `teamleader.fatuma.alemu@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc2 | ACTIVE |
| 78 | `teamleader-dire_dawa-tc2-joint-2` | Chaltu Tesfa | `teamleader.chaltu.tesfa@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc2 | ACTIVE |
| 79 | `teamleader-dire_dawa-tc2-tp-1` | Tirhas Mengistu | `teamleader.tirhas.mengistu@mor.gov.et` | TRANSFER_PRICING | dire_dawa-tc2 | ACTIVE |
| 80 | `teamleader-dire_dawa-tc2-tp-2` | Kassahun Wakjira | `teamleader.kassahun.wakjira@mor.gov.et` | TRANSFER_PRICING | dire_dawa-tc2 | ACTIVE |
| 81 | `teamleader-dire_dawa-tc3-comp-1` | Addis Banti | `teamleader.addis.banti@mor.gov.et` | COMPREHENSIVE_AUDIT | dire_dawa-tc3 | ACTIVE |
| 82 | `teamleader-dire_dawa-tc3-comp-2` | Nardos Alemayehu | `teamleader.nardos.alemayehu@mor.gov.et` | COMPREHENSIVE_AUDIT | dire_dawa-tc3 | ACTIVE |
| 83 | `teamleader-dire_dawa-tc3-desk-1` | Birtukan Mengistu | `teamleader.birtukan.mengistu@mor.gov.et` | DESK_AUDIT | dire_dawa-tc3 | ACTIVE |
| 84 | `teamleader-dire_dawa-tc3-desk-2` | Lalisa Wakjira | `teamleader.lalisa.wakjira@mor.gov.et` | DESK_AUDIT | dire_dawa-tc3 | ACTIVE |
| 85 | `teamleader-dire_dawa-tc3-issue-1` | Abdi Kassa | `teamleader.abdi.kassa2@mor.gov.et` | ISSUE_AUDIT | dire_dawa-tc3 | ACTIVE |
| 86 | `teamleader-dire_dawa-tc3-issue-2` | Mahlet Worku | `teamleader.mahlet.worku2@mor.gov.et` | ISSUE_AUDIT | dire_dawa-tc3 | ACTIVE |
| 87 | `teamleader-dire_dawa-tc3-joint-1` | Kidist Bekele | `teamleader.kidist.bekele@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc3 | ACTIVE |
| 88 | `teamleader-dire_dawa-tc3-joint-2` | Robel Kebede | `teamleader.robel.kebede@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc3 | ACTIVE |
| 89 | `teamleader-dire_dawa-tc3-tp-1` | Diriba Tesfa | `teamleader.diriba.tesfa@mor.gov.et` | TRANSFER_PRICING | dire_dawa-tc3 | ACTIVE |
| 90 | `teamleader-dire_dawa-tc3-tp-2` | Tolera Getachew | `teamleader.tolera.getachew@mor.gov.et` | TRANSFER_PRICING | dire_dawa-tc3 | ACTIVE |
| 91 | `teamleader-federal-lto1-comp-1` | Mamo Bekele | `teamleader.mamo.bekele@mor.gov.et` | COMPREHENSIVE_AUDIT | federal-lto1 | ACTIVE |
| 92 | `teamleader-federal-lto1-comp-2` | Kassa Kebede | `teamleader.kassa.kebede@mor.gov.et` | COMPREHENSIVE_AUDIT | federal-lto1 | ACTIVE |
| 93 | `teamleader-federal-lto1-desk-1` | Getnet Tesfa | `teamleader.getnet.tesfa@mor.gov.et` | DESK_AUDIT | federal-lto1 | ACTIVE |
| 94 | `teamleader-federal-lto1-desk-2` | Gemechu Alemu | `teamleader.gemechu.alemu@mor.gov.et` | DESK_AUDIT | federal-lto1 | ACTIVE |
| 95 | `teamleader-federal-lto1-issue-1` | Kassahun Assefa | `teamleader.kassahun.assefa@mor.gov.et` | ISSUE_AUDIT | federal-lto1 | ACTIVE |
| 96 | `teamleader-federal-lto1-issue-2` | Fatuma Tilahun | `teamleader.fatuma.tilahun@mor.gov.et` | ISSUE_AUDIT | federal-lto1 | ACTIVE |
| 97 | `teamleader-federal-lto1-ja-1` | Abebe Haile | `teamleader.abebe.haile@mor.gov.et` | JOINT_AUDIT | federal-lto1 | ACTIVE |
| 98 | `teamleader-federal-lto1-ja-2` | Nardos Negash | `teamleader.nardos.negash@mor.gov.et` | JOINT_AUDIT | federal-lto1 | ACTIVE |
| 99 | `teamleader-federal-lto1-tp-1` | Michael Abera | `teamleader.michael.abera@mor.gov.et` | TRANSFER_PRICING | federal-lto1 | ACTIVE |
| 100 | `teamleader-federal-lto1-tp-2` | Eyerusalem Wolde | `teamleader.eyerusalem.wolde@mor.gov.et` | TRANSFER_PRICING | federal-lto1 | ACTIVE |
| 101 | `teamleader-federal-lto2-comp-1` | Fatuma Yohannes | `teamleader.fatuma.yohannes@mor.gov.et` | COMPREHENSIVE_AUDIT | federal-lto2 | ACTIVE |
| 102 | `teamleader-federal-lto2-comp-2` | Chaltu Hassan | `teamleader.chaltu.hassan@mor.gov.et` | COMPREHENSIVE_AUDIT | federal-lto2 | ACTIVE |
| 103 | `teamleader-federal-lto2-desk-1` | Dawit Getachew | `teamleader.dawit.getachew@mor.gov.et` | DESK_AUDIT | federal-lto2 | ACTIVE |
| 104 | `teamleader-federal-lto2-desk-2` | Haile Mideksa | `teamleader.haile.mideksa@mor.gov.et` | DESK_AUDIT | federal-lto2 | ACTIVE |
| 105 | `teamleader-federal-lto2-issue-1` | Addis Yohannes | `teamleader.addis.yohannes@mor.gov.et` | ISSUE_AUDIT | federal-lto2 | ACTIVE |
| 106 | `teamleader-federal-lto2-issue-2` | Kidist Mideksa | `teamleader.kidist.mideksa@mor.gov.et` | ISSUE_AUDIT | federal-lto2 | ACTIVE |
| 107 | `teamleader-federal-lto2-ja-1` | Berhanu Bekele | `teamleader.berhanu.bekele@mor.gov.et` | JOINT_AUDIT | federal-lto2 | ACTIVE |
| 108 | `teamleader-federal-lto2-ja-2` | Eleni Banti | `teamleader.eleni.banti@mor.gov.et` | JOINT_AUDIT | federal-lto2 | ACTIVE |
| 109 | `teamleader-federal-lto2-tp-1` | Ibrahim Bikila | `teamleader.ibrahim.bikila@mor.gov.et` | TRANSFER_PRICING | federal-lto2 | ACTIVE |
| 110 | `teamleader-federal-lto2-tp-2` | Yonas Tesfaye | `teamleader.yonas.tesfaye@mor.gov.et` | TRANSFER_PRICING | federal-lto2 | ACTIVE |
| 111 | `teamleader-oromia-tc1-comp-1` | Saron Bikila | `teamleader.saron.bikila@mor.gov.et` | COMPREHENSIVE_AUDIT | oromia-tc1 | ACTIVE |
| 112 | `teamleader-oromia-tc1-comp-2` | Michael Tesfaye | `teamleader.michael.tesfaye@mor.gov.et` | COMPREHENSIVE_AUDIT | oromia-tc1 | ACTIVE |
| 113 | `teamleader-oromia-tc1-desk-1` | Tsega Negash | `teamleader.tsega.negash@mor.gov.et` | DESK_AUDIT | oromia-tc1 | ACTIVE |
| 114 | `teamleader-oromia-tc1-desk-2` | Abebe Zewde | `teamleader.abebe.zewde@mor.gov.et` | DESK_AUDIT | oromia-tc1 | ACTIVE |
| 115 | `teamleader-oromia-tc1-issue-1` | Tigist Wakjira | `teamleader.tigist.wakjira@mor.gov.et` | ISSUE_AUDIT | oromia-tc1 | ACTIVE |
| 116 | `teamleader-oromia-tc1-issue-2` | Almaz Banti | `teamleader.almaz.banti@mor.gov.et` | ISSUE_AUDIT | oromia-tc1 | ACTIVE |
| 117 | `teamleader-oromia-tc1-joint-1` | Gemechu Kebede | `teamleader.gemechu.kebede@mor.gov.et` | JOINT_AUDIT | oromia-tc1 | ACTIVE |
| 118 | `teamleader-oromia-tc1-joint-2` | Getnet Bekele | `teamleader.getnet.bekele@mor.gov.et` | JOINT_AUDIT | oromia-tc1 | ACTIVE |
| 119 | `teamleader-oromia-tc1-tp-1` | Birtukan Berhane | `teamleader.birtukan.berhane@mor.gov.et` | TRANSFER_PRICING | oromia-tc1 | ACTIVE |
| 120 | `teamleader-oromia-tc1-tp-2` | Lalisa Wolde | `teamleader.lalisa.wolde@mor.gov.et` | TRANSFER_PRICING | oromia-tc1 | ACTIVE |
| 121 | `teamleader-oromia-tc2-comp-1` | Yodit Tesfaye | `teamleader.yodit.tesfaye@mor.gov.et` | COMPREHENSIVE_AUDIT | oromia-tc2 | ACTIVE |
| 122 | `teamleader-oromia-tc2-comp-2` | Natnael Bikila | `teamleader.natnael.bikila@mor.gov.et` | COMPREHENSIVE_AUDIT | oromia-tc2 | ACTIVE |
| 123 | `teamleader-oromia-tc2-desk-1` | Sara Lemma | `teamleader.sara.lemma@mor.gov.et` | DESK_AUDIT | oromia-tc2 | ACTIVE |
| 124 | `teamleader-oromia-tc2-desk-2` | Seble Mulugeta | `teamleader.seble.mulugeta@mor.gov.et` | DESK_AUDIT | oromia-tc2 | ACTIVE |
| 125 | `teamleader-oromia-tc2-issue-1` | Mulugeta Tadesse | `teamleader.mulugeta.tadesse@mor.gov.et` | ISSUE_AUDIT | oromia-tc2 | ACTIVE |
| 126 | `teamleader-oromia-tc2-issue-2` | Rahel Mamo | `teamleader.rahel.mamo@mor.gov.et` | ISSUE_AUDIT | oromia-tc2 | ACTIVE |
| 127 | `teamleader-oromia-tc2-joint-1` | Getnet Bikila | `teamleader.getnet.bikila@mor.gov.et` | JOINT_AUDIT | oromia-tc2 | ACTIVE |
| 128 | `teamleader-oromia-tc2-joint-2` | Solomon Zewde | `teamleader.solomon.zewde@mor.gov.et` | JOINT_AUDIT | oromia-tc2 | ACTIVE |
| 129 | `teamleader-oromia-tc2-tp-1` | Tsega Wakjira | `teamleader.tsega.wakjira@mor.gov.et` | TRANSFER_PRICING | oromia-tc2 | ACTIVE |
| 130 | `teamleader-oromia-tc2-tp-2` | Berihun Banti | `teamleader.berihun.banti@mor.gov.et` | TRANSFER_PRICING | oromia-tc2 | ACTIVE |
| 131 | `teamleader-oromia-tc3-comp-1` | Mesfin Mideksa | `teamleader.mesfin.mideksa2@mor.gov.et` | COMPREHENSIVE_AUDIT | oromia-tc3 | ACTIVE |
| 132 | `teamleader-oromia-tc3-comp-2` | Fikremariam Getachew | `teamleader.fikremariam.getachew2@mor.gov.et` | COMPREHENSIVE_AUDIT | oromia-tc3 | ACTIVE |
| 133 | `teamleader-oromia-tc3-desk-1` | Rahel Hassan | `teamleader.rahel.hassan@mor.gov.et` | DESK_AUDIT | oromia-tc3 | ACTIVE |
| 134 | `teamleader-oromia-tc3-desk-2` | Berihun Yohannes | `teamleader.berihun.yohannes@mor.gov.et` | DESK_AUDIT | oromia-tc3 | ACTIVE |
| 135 | `teamleader-oromia-tc3-issue-1` | Workneh Bekele | `teamleader.workneh.bekele2@mor.gov.et` | ISSUE_AUDIT | oromia-tc3 | ACTIVE |
| 136 | `teamleader-oromia-tc3-issue-2` | Tadesse Alemu | `teamleader.tadesse.alemu@mor.gov.et` | ISSUE_AUDIT | oromia-tc3 | ACTIVE |
| 137 | `teamleader-oromia-tc3-joint-1` | Eden Abera | `teamleader.eden.abera@mor.gov.et` | JOINT_AUDIT | oromia-tc3 | ACTIVE |
| 138 | `teamleader-oromia-tc3-joint-2` | Meseret Wolde | `teamleader.meseret.wolde@mor.gov.et` | JOINT_AUDIT | oromia-tc3 | ACTIVE |
| 139 | `teamleader-oromia-tc3-tp-1` | Henok Getachew | `teamleader.henok.getachew@mor.gov.et` | TRANSFER_PRICING | oromia-tc3 | ACTIVE |
| 140 | `teamleader-oromia-tc3-tp-2` | Genet Mideksa | `teamleader.genet.mideksa@mor.gov.et` | TRANSFER_PRICING | oromia-tc3 | ACTIVE |
| 141 | `teamleader-snnpr-tc1-comp-1` | Haile Gebre | `teamleader.haile.gebre@mor.gov.et` | COMPREHENSIVE_AUDIT | snnpr-tc1 | ACTIVE |
| 142 | `teamleader-snnpr-tc1-comp-2` | Tekle Lemma | `teamleader.tekle.lemma@mor.gov.et` | COMPREHENSIVE_AUDIT | snnpr-tc1 | ACTIVE |
| 143 | `teamleader-snnpr-tc1-desk-1` | Workneh Wolde | `teamleader.workneh.wolde@mor.gov.et` | DESK_AUDIT | snnpr-tc1 | ACTIVE |
| 144 | `teamleader-snnpr-tc1-desk-2` | Tadesse Abera | `teamleader.tadesse.abera@mor.gov.et` | DESK_AUDIT | snnpr-tc1 | ACTIVE |
| 145 | `teamleader-snnpr-tc1-issue-1` | Rahel Wolde | `teamleader.rahel.wolde@mor.gov.et` | ISSUE_AUDIT | snnpr-tc1 | ACTIVE |
| 146 | `teamleader-snnpr-tc1-issue-2` | Berihun Berhane | `teamleader.berihun.berhane@mor.gov.et` | ISSUE_AUDIT | snnpr-tc1 | ACTIVE |
| 147 | `teamleader-snnpr-tc1-joint-1` | Eden Haile | `teamleader.eden.haile@mor.gov.et` | JOINT_AUDIT | snnpr-tc1 | ACTIVE |
| 148 | `teamleader-snnpr-tc1-joint-2` | Meseret Negash | `teamleader.meseret.negash@mor.gov.et` | JOINT_AUDIT | snnpr-tc1 | ACTIVE |
| 149 | `teamleader-snnpr-tc1-tp-1` | Henok Tilahun | `teamleader.henok.tilahun@mor.gov.et` | TRANSFER_PRICING | snnpr-tc1 | ACTIVE |
| 150 | `teamleader-snnpr-tc1-tp-2` | Seble Assefa | `teamleader.seble.assefa@mor.gov.et` | TRANSFER_PRICING | snnpr-tc1 | ACTIVE |
| 151 | `teamleader-snnpr-tc2-comp-1` | Solomon Mengistu | `teamleader.solomon.mengistu@mor.gov.et` | COMPREHENSIVE_AUDIT | snnpr-tc2 | ACTIVE |
| 152 | `teamleader-snnpr-tc2-comp-2` | Getnet Hassan | `teamleader.getnet.hassan@mor.gov.et` | COMPREHENSIVE_AUDIT | snnpr-tc2 | ACTIVE |
| 153 | `teamleader-snnpr-tc2-desk-1` | Dereje Banti | `teamleader.dereje.banti@mor.gov.et` | DESK_AUDIT | snnpr-tc2 | ACTIVE |
| 154 | `teamleader-snnpr-tc2-desk-2` | Lalisa Wakjira | `teamleader.lalisa.wakjira2@mor.gov.et` | DESK_AUDIT | snnpr-tc2 | ACTIVE |
| 155 | `teamleader-snnpr-tc2-issue-1` | Tadesse Berhane | `teamleader.tadesse.berhane@mor.gov.et` | ISSUE_AUDIT | snnpr-tc2 | ACTIVE |
| 156 | `teamleader-snnpr-tc2-issue-2` | Almaw Wolde | `teamleader.almaw.wolde@mor.gov.et` | ISSUE_AUDIT | snnpr-tc2 | ACTIVE |
| 157 | `teamleader-snnpr-tc2-joint-1` | Bereket Mideksa | `teamleader.bereket.mideksa@mor.gov.et` | JOINT_AUDIT | snnpr-tc2 | ACTIVE |
| 158 | `teamleader-snnpr-tc2-joint-2` | Selam Yohannes | `teamleader.selam.yohannes@mor.gov.et` | JOINT_AUDIT | snnpr-tc2 | ACTIVE |
| 159 | `teamleader-snnpr-tc2-tp-1` | Tsega Tesfa | `teamleader.tsega.tesfa@mor.gov.et` | TRANSFER_PRICING | snnpr-tc2 | ACTIVE |
| 160 | `teamleader-snnpr-tc2-tp-2` | Abebe Alemu | `teamleader.abebe.alemu@mor.gov.et` | TRANSFER_PRICING | snnpr-tc2 | ACTIVE |
| 161 | `teamleader-snnpr-tc3-comp-1` | Ruth Worku | `teamleader.ruth.worku@mor.gov.et` | COMPREHENSIVE_AUDIT | snnpr-tc3 | ACTIVE |
| 162 | `teamleader-snnpr-tc3-comp-2` | Tewodros Haile | `teamleader.tewodros.haile@mor.gov.et` | COMPREHENSIVE_AUDIT | snnpr-tc3 | ACTIVE |
| 163 | `teamleader-snnpr-tc3-desk-1` | Diriba Mamo | `teamleader.diriba.mamo2@mor.gov.et` | DESK_AUDIT | snnpr-tc3 | ACTIVE |
| 164 | `teamleader-snnpr-tc3-desk-2` | Mulugeta Kassa | `teamleader.mulugeta.kassa2@mor.gov.et` | DESK_AUDIT | snnpr-tc3 | ACTIVE |
| 165 | `teamleader-snnpr-tc3-issue-1` | Tsega Negash | `teamleader.tsega.negash2@mor.gov.et` | ISSUE_AUDIT | snnpr-tc3 | ACTIVE |
| 166 | `teamleader-snnpr-tc3-issue-2` | Abebe Zewde | `teamleader.abebe.zewde2@mor.gov.et` | ISSUE_AUDIT | snnpr-tc3 | ACTIVE |
| 167 | `teamleader-snnpr-tc3-joint-1` | Selam Kassa | `teamleader.selam.kassa@mor.gov.et` | JOINT_AUDIT | snnpr-tc3 | ACTIVE |
| 168 | `teamleader-snnpr-tc3-joint-2` | Meron Mamo | `teamleader.meron.mamo@mor.gov.et` | JOINT_AUDIT | snnpr-tc3 | ACTIVE |
| 169 | `teamleader-snnpr-tc3-tp-1` | Birtukan Mengistu | `teamleader.birtukan.mengistu2@mor.gov.et` | TRANSFER_PRICING | snnpr-tc3 | ACTIVE |
| 170 | `teamleader-snnpr-tc3-tp-2` | Genet Hassan | `teamleader.genet.hassan@mor.gov.et` | TRANSFER_PRICING | snnpr-tc3 | ACTIVE |
| 171 | `teamleader-somali-tc1-comp-1` | Genet Desta | `teamleader.genet.desta@mor.gov.et` | COMPREHENSIVE_AUDIT | somali-tc1 | ACTIVE |
| 172 | `teamleader-somali-tc1-comp-2` | Birtukan Berhane | `teamleader.birtukan.berhane2@mor.gov.et` | COMPREHENSIVE_AUDIT | somali-tc1 | ACTIVE |
| 173 | `teamleader-somali-tc1-desk-1` | Ibrahim Alemayehu | `teamleader.ibrahim.alemayehu@mor.gov.et` | DESK_AUDIT | somali-tc1 | ACTIVE |
| 174 | `teamleader-somali-tc1-desk-2` | Gemechu Kifle | `teamleader.gemechu.kifle@mor.gov.et` | DESK_AUDIT | somali-tc1 | ACTIVE |
| 175 | `teamleader-somali-tc1-issue-1` | Meron Negash | `teamleader.meron.negash2@mor.gov.et` | ISSUE_AUDIT | somali-tc1 | ACTIVE |
| 176 | `teamleader-somali-tc1-issue-2` | Selam Zewde | `teamleader.selam.zewde@mor.gov.et` | ISSUE_AUDIT | somali-tc1 | ACTIVE |
| 177 | `teamleader-somali-tc1-joint-1` | Abebe Tilahun | `teamleader.abebe.tilahun@mor.gov.et` | JOINT_AUDIT | somali-tc1 | ACTIVE |
| 178 | `teamleader-somali-tc1-joint-2` | Almaw Assefa | `teamleader.almaw.assefa@mor.gov.et` | JOINT_AUDIT | somali-tc1 | ACTIVE |
| 179 | `teamleader-somali-tc1-tp-1` | Dawit Haile | `teamleader.dawit.haile@mor.gov.et` | TRANSFER_PRICING | somali-tc1 | ACTIVE |
| 180 | `teamleader-somali-tc1-tp-2` | Meron Negash | `teamleader.meron.negash@mor.gov.et` | TRANSFER_PRICING | somali-tc1 | ACTIVE |
| 181 | `teamleader-somali-tc2-comp-1` | Abebe Kifle | `teamleader.abebe.kifle@mor.gov.et` | COMPREHENSIVE_AUDIT | somali-tc2 | ACTIVE |
| 182 | `teamleader-somali-tc2-comp-2` | Almaw Alemayehu | `teamleader.almaw.alemayehu@mor.gov.et` | COMPREHENSIVE_AUDIT | somali-tc2 | ACTIVE |
| 183 | `teamleader-somali-tc2-desk-1` | Kassa Berhane | `teamleader.kassa.berhane@mor.gov.et` | DESK_AUDIT | somali-tc2 | ACTIVE |
| 184 | `teamleader-somali-tc2-desk-2` | Bikila Desta | `teamleader.bikila.desta@mor.gov.et` | DESK_AUDIT | somali-tc2 | ACTIVE |
| 185 | `teamleader-somali-tc2-issue-1` | Amanuel Yohannes | `teamleader.amanuel.yohannes@mor.gov.et` | ISSUE_AUDIT | somali-tc2 | ACTIVE |
| 186 | `teamleader-somali-tc2-issue-2` | Meseret Hassan | `teamleader.meseret.hassan@mor.gov.et` | ISSUE_AUDIT | somali-tc2 | ACTIVE |
| 187 | `teamleader-somali-tc2-joint-1` | Tsega Assefa | `teamleader.tsega.assefa@mor.gov.et` | JOINT_AUDIT | somali-tc2 | ACTIVE |
| 188 | `teamleader-somali-tc2-joint-2` | Berihun Tilahun | `teamleader.berihun.tilahun@mor.gov.et` | JOINT_AUDIT | somali-tc2 | ACTIVE |
| 189 | `teamleader-somali-tc2-tp-1` | Samuel Belay | `teamleader.samuel.belay@mor.gov.et` | TRANSFER_PRICING | somali-tc2 | ACTIVE |
| 190 | `teamleader-somali-tc2-tp-2` | Eden Tadesse | `teamleader.eden.tadesse@mor.gov.et` | TRANSFER_PRICING | somali-tc2 | ACTIVE |
| 191 | `teamleader-somali-tc3-comp-1` | Seble Belay | `teamleader.seble.belay@mor.gov.et` | COMPREHENSIVE_AUDIT | somali-tc3 | ACTIVE |
| 192 | `teamleader-somali-tc3-comp-2` | Henok Girma | `teamleader.henok.girma@mor.gov.et` | COMPREHENSIVE_AUDIT | somali-tc3 | ACTIVE |
| 193 | `teamleader-somali-tc3-desk-1` | Chaltu Mamo | `teamleader.chaltu.mamo@mor.gov.et` | DESK_AUDIT | somali-tc3 | ACTIVE |
| 194 | `teamleader-somali-tc3-desk-2` | Yonas Tadesse | `teamleader.yonas.tadesse@mor.gov.et` | DESK_AUDIT | somali-tc3 | ACTIVE |
| 195 | `teamleader-somali-tc3-issue-1` | Bereket Assefa | `teamleader.bereket.assefa@mor.gov.et` | ISSUE_AUDIT | somali-tc3 | ACTIVE |
| 196 | `teamleader-somali-tc3-issue-2` | Solomon Girma | `teamleader.solomon.girma@mor.gov.et` | ISSUE_AUDIT | somali-tc3 | ACTIVE |
| 197 | `teamleader-somali-tc3-joint-1` | Tadesse Yohannes | `teamleader.tadesse.yohannes@mor.gov.et` | JOINT_AUDIT | somali-tc3 | ACTIVE |
| 198 | `teamleader-somali-tc3-joint-2` | Workneh Mideksa | `teamleader.workneh.mideksa@mor.gov.et` | JOINT_AUDIT | somali-tc3 | ACTIVE |
| 199 | `teamleader-somali-tc3-tp-1` | Tekle Kebede | `teamleader.tekle.kebede@mor.gov.et` | TRANSFER_PRICING | somali-tc3 | ACTIVE |
| 200 | `teamleader-somali-tc3-tp-2` | Haile Mekonnen | `teamleader.haile.mekonnen@mor.gov.et` | TRANSFER_PRICING | somali-tc3 | ACTIVE |

---

## 10. Audit Specialists & Auditors (By Location & Stream)

**Total Accounts:** 520  

| # | Username | Full Name | Official Login Email | Role / Stream | Assigned Location | Status |
|---|---|---|---|---|---|---|
| 1 | `auditor-aa1-1` | Sara Mohammed | `auditor.sara.mohammed@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc1 | ACTIVE |
| 2 | `auditor-aa1-10` | Bethlehem Kebede | `auditor.bethlehem.kebede@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc1 | ACTIVE |
| 3 | `auditor-aa1-2` | Yonas Berhanu | `auditor.yonas.berhanu@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc1 | ACTIVE |
| 4 | `auditor-aa1-3` | Hana Girma | `auditor.hana.girma@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc1 | ACTIVE |
| 5 | `auditor-aa1-4` | Mulugeta Alemayehu | `auditor.mulugeta.alemayehu@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc1 | ACTIVE |
| 6 | `auditor-aa1-5` | Tigist Haile | `auditor.tigist.haile@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc1 | ACTIVE |
| 7 | `auditor-aa1-6` | Kassahun Tekle | `auditor.kassahun.tekle@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc1 | ACTIVE |
| 8 | `auditor-aa1-7` | Meron Desta | `auditor.meron.desta@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc1 | ACTIVE |
| 9 | `auditor-aa1-8` | Bereket Wolde | `auditor.bereket.wolde@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc1 | ACTIVE |
| 10 | `auditor-aa1-9` | Solomon Lemma | `auditor.solomon.lemma@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc1 | ACTIVE |
| 11 | `auditor-addis_ababa-tc1-comp-1-1` | Kassahun Bekele | `auditor.kassahun.bekele@mor.gov.et` | COMPREHENSIVE_AUDIT | addis_ababa-tc1 | ACTIVE |
| 12 | `auditor-addis_ababa-tc1-comp-1-2` | Tirhas Kebede | `auditor.tirhas.kebede@mor.gov.et` | COMPREHENSIVE_AUDIT | addis_ababa-tc1 | ACTIVE |
| 13 | `auditor-addis_ababa-tc1-comp-2-1` | Tirhas Kassa | `auditor.tirhas.kassa@mor.gov.et` | COMPREHENSIVE_AUDIT | addis_ababa-tc1 | ACTIVE |
| 14 | `auditor-addis_ababa-tc1-comp-2-2` | Mekdes Worku | `auditor.mekdes.worku@mor.gov.et` | COMPREHENSIVE_AUDIT | addis_ababa-tc1 | ACTIVE |
| 15 | `auditor-addis_ababa-tc1-desk-1-1` | Fikadu Negash | `auditor.fikadu.negash@mor.gov.et` | DESK_AUDIT | addis_ababa-tc1 | ACTIVE |
| 16 | `auditor-addis_ababa-tc1-desk-1-2` | Bethlehem Zewde | `auditor.bethlehem.zewde@mor.gov.et` | DESK_AUDIT | addis_ababa-tc1 | ACTIVE |
| 17 | `auditor-addis_ababa-tc1-desk-2-1` | Bethlehem Berhane | `auditor.bethlehem.berhane@mor.gov.et` | DESK_AUDIT | addis_ababa-tc1 | ACTIVE |
| 18 | `auditor-addis_ababa-tc1-desk-2-2` | Yosef Desta | `auditor.yosef.desta@mor.gov.et` | DESK_AUDIT | addis_ababa-tc1 | ACTIVE |
| 19 | `auditor-addis_ababa-tc1-issue-1-1` | Seble Desta | `auditor.seble.desta@mor.gov.et` | ISSUE_AUDIT | addis_ababa-tc1 | ACTIVE |
| 20 | `auditor-addis_ababa-tc1-issue-1-2` | Henok Berhane | `auditor.henok.berhane@mor.gov.et` | ISSUE_AUDIT | addis_ababa-tc1 | ACTIVE |
| 21 | `auditor-addis_ababa-tc1-issue-2-1` | Henok Zewde | `auditor.henok.zewde@mor.gov.et` | ISSUE_AUDIT | addis_ababa-tc1 | ACTIVE |
| 22 | `auditor-addis_ababa-tc1-issue-2-2` | Genet Negash | `auditor.genet.negash@mor.gov.et` | ISSUE_AUDIT | addis_ababa-tc1 | ACTIVE |
| 23 | `auditor-addis_ababa-tc1-tp-1-1` | Tolera Getachew | `auditor.tolera.getachew@mor.gov.et` | TRANSFER_PRICING | addis_ababa-tc1 | ACTIVE |
| 24 | `auditor-addis_ababa-tc1-tp-1-2` | Mahlet Mideksa | `auditor.mahlet.mideksa@mor.gov.et` | TRANSFER_PRICING | addis_ababa-tc1 | ACTIVE |
| 25 | `auditor-addis_ababa-tc1-tp-2-1` | Mahlet Desta | `auditor.mahlet.desta@mor.gov.et` | TRANSFER_PRICING | addis_ababa-tc1 | ACTIVE |
| 26 | `auditor-addis_ababa-tc1-tp-2-2` | Abdi Berhane | `auditor.abdi.berhane@mor.gov.et` | TRANSFER_PRICING | addis_ababa-tc1 | ACTIVE |
| 27 | `auditor-addis_ababa-tc2-comp-1-1` | Hassen Mengistu | `auditor.hassen.mengistu@mor.gov.et` | COMPREHENSIVE_AUDIT | addis_ababa-tc2 | ACTIVE |
| 28 | `auditor-addis_ababa-tc2-comp-1-2` | Abdi Wakjira | `auditor.abdi.wakjira@mor.gov.et` | COMPREHENSIVE_AUDIT | addis_ababa-tc2 | ACTIVE |
| 29 | `auditor-addis_ababa-tc2-comp-2-1` | Abdi Gebre | `auditor.abdi.gebre@mor.gov.et` | COMPREHENSIVE_AUDIT | addis_ababa-tc2 | ACTIVE |
| 30 | `auditor-addis_ababa-tc2-comp-2-2` | Ephrem Lemma | `auditor.ephrem.lemma@mor.gov.et` | COMPREHENSIVE_AUDIT | addis_ababa-tc2 | ACTIVE |
| 31 | `auditor-addis_ababa-tc2-desk-1-1` | Tadesse Zewde | `auditor.tadesse.zewde@mor.gov.et` | DESK_AUDIT | addis_ababa-tc2 | ACTIVE |
| 32 | `auditor-addis_ababa-tc2-desk-1-2` | Workneh Bikila | `auditor.workneh.bikila@mor.gov.et` | DESK_AUDIT | addis_ababa-tc2 | ACTIVE |
| 33 | `auditor-addis_ababa-tc2-desk-2-1` | Workneh Desta | `auditor.workneh.desta@mor.gov.et` | DESK_AUDIT | addis_ababa-tc2 | ACTIVE |
| 34 | `auditor-addis_ababa-tc2-desk-2-2` | Almaz Kifle | `auditor.almaz.kifle@mor.gov.et` | DESK_AUDIT | addis_ababa-tc2 | ACTIVE |
| 35 | `auditor-addis_ababa-tc2-issue-1-1` | Henok Girma | `auditor.henok.girma2@mor.gov.et` | ISSUE_AUDIT | addis_ababa-tc2 | ACTIVE |
| 36 | `auditor-addis_ababa-tc2-issue-1-2` | Seble Belay | `auditor.seble.belay@mor.gov.et` | ISSUE_AUDIT | addis_ababa-tc2 | ACTIVE |
| 37 | `auditor-addis_ababa-tc2-issue-2-1` | Seble Bikila | `auditor.seble.bikila@mor.gov.et` | ISSUE_AUDIT | addis_ababa-tc2 | ACTIVE |
| 38 | `auditor-addis_ababa-tc2-issue-2-2` | Sara Tesfaye | `auditor.sara.tesfaye2@mor.gov.et` | ISSUE_AUDIT | addis_ababa-tc2 | ACTIVE |
| 39 | `auditor-addis_ababa-tc2-joint-1` | Getnet Bekele | `auditor.getnet.bekele@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc2 | ACTIVE |
| 40 | `auditor-addis_ababa-tc2-joint-10` | Lalisa Mideksa | `auditor.lalisa.mideksa@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc2 | ACTIVE |
| 41 | `auditor-addis_ababa-tc2-joint-2` | Solomon Alemu | `auditor.solomon.alemu@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc2 | ACTIVE |
| 42 | `auditor-addis_ababa-tc2-joint-3` | Bereket Tesfa | `auditor.bereket.tesfa@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc2 | ACTIVE |
| 43 | `auditor-addis_ababa-tc2-joint-4` | Selam Getachew | `auditor.selam.getachew@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc2 | ACTIVE |
| 44 | `auditor-addis_ababa-tc2-joint-5` | Meron Mideksa | `auditor.meron.mideksa@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc2 | ACTIVE |
| 45 | `auditor-addis_ababa-tc2-joint-6` | Dawit Yohannes | `auditor.dawit.yohannes@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc2 | ACTIVE |
| 46 | `auditor-addis_ababa-tc2-joint-7` | Haile Hassan | `auditor.haile.hassan@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc2 | ACTIVE |
| 47 | `auditor-addis_ababa-tc2-joint-8` | Tekle Mengistu | `auditor.tekle.mengistu@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc2 | ACTIVE |
| 48 | `auditor-addis_ababa-tc2-joint-9` | Bikila Wakjira | `auditor.bikila.wakjira@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc2 | ACTIVE |
| 49 | `auditor-addis_ababa-tc2-tp-1-1` | Mekdes Bikila | `auditor.mekdes.bikila@mor.gov.et` | TRANSFER_PRICING | addis_ababa-tc2 | ACTIVE |
| 50 | `auditor-addis_ababa-tc2-tp-1-2` | Tirhas Zewde | `auditor.tirhas.zewde@mor.gov.et` | TRANSFER_PRICING | addis_ababa-tc2 | ACTIVE |
| 51 | `auditor-addis_ababa-tc2-tp-2-1` | Tirhas Girma | `auditor.tirhas.girma@mor.gov.et` | TRANSFER_PRICING | addis_ababa-tc2 | ACTIVE |
| 52 | `auditor-addis_ababa-tc2-tp-2-2` | Kassahun Assefa | `auditor.kassahun.assefa@mor.gov.et` | TRANSFER_PRICING | addis_ababa-tc2 | ACTIVE |
| 53 | `auditor-addis_ababa-tc3-comp-1-1` | Kidist Wakjira | `auditor.kidist.wakjira@mor.gov.et` | COMPREHENSIVE_AUDIT | addis_ababa-tc3 | ACTIVE |
| 54 | `auditor-addis_ababa-tc3-comp-1-2` | Addis Banti | `auditor.addis.banti@mor.gov.et` | COMPREHENSIVE_AUDIT | addis_ababa-tc3 | ACTIVE |
| 55 | `auditor-addis_ababa-tc3-comp-2-1` | Addis Lemma | `auditor.addis.lemma@mor.gov.et` | COMPREHENSIVE_AUDIT | addis_ababa-tc3 | ACTIVE |
| 56 | `auditor-addis_ababa-tc3-comp-2-2` | Nardos Mulugeta | `auditor.nardos.mulugeta@mor.gov.et` | COMPREHENSIVE_AUDIT | addis_ababa-tc3 | ACTIVE |
| 57 | `auditor-addis_ababa-tc3-desk-1-1` | Seble Bikila | `auditor.seble.bikila2@mor.gov.et` | DESK_AUDIT | addis_ababa-tc3 | ACTIVE |
| 58 | `auditor-addis_ababa-tc3-desk-1-2` | Sara Tesfaye | `auditor.sara.tesfaye3@mor.gov.et` | DESK_AUDIT | addis_ababa-tc3 | ACTIVE |
| 59 | `auditor-addis_ababa-tc3-desk-2-1` | Sara Kifle | `auditor.sara.kifle@mor.gov.et` | DESK_AUDIT | addis_ababa-tc3 | ACTIVE |
| 60 | `auditor-addis_ababa-tc3-desk-2-2` | Fikadu Alemayehu | `auditor.fikadu.alemayehu2@mor.gov.et` | DESK_AUDIT | addis_ababa-tc3 | ACTIVE |
| 61 | `auditor-addis_ababa-tc3-issue-1-1` | Genet Mamo | `auditor.genet.mamo@mor.gov.et` | ISSUE_AUDIT | addis_ababa-tc3 | ACTIVE |
| 62 | `auditor-addis_ababa-tc3-issue-1-2` | Birtukan Tadesse | `auditor.birtukan.tadesse@mor.gov.et` | ISSUE_AUDIT | addis_ababa-tc3 | ACTIVE |
| 63 | `auditor-addis_ababa-tc3-issue-2-1` | Birtukan Alemu | `auditor.birtukan.alemu@mor.gov.et` | ISSUE_AUDIT | addis_ababa-tc3 | ACTIVE |
| 64 | `auditor-addis_ababa-tc3-issue-2-2` | Lalisa Tesfa | `auditor.lalisa.tesfa@mor.gov.et` | ISSUE_AUDIT | addis_ababa-tc3 | ACTIVE |
| 65 | `auditor-addis_ababa-tc3-joint-1` | Eden Alemu | `auditor.eden.alemu@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc3 | ACTIVE |
| 66 | `auditor-addis_ababa-tc3-joint-10` | Berihun Yohannes | `auditor.berihun.yohannes@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc3 | ACTIVE |
| 67 | `auditor-addis_ababa-tc3-joint-2` | Meseret Bekele | `auditor.meseret.bekele@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc3 | ACTIVE |
| 68 | `auditor-addis_ababa-tc3-joint-3` | Amanuel Kebede | `auditor.amanuel.kebede@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc3 | ACTIVE |
| 69 | `auditor-addis_ababa-tc3-joint-4` | Ruth Mekonnen | `auditor.ruth.mekonnen@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc3 | ACTIVE |
| 70 | `auditor-addis_ababa-tc3-joint-5` | Tewodros Tilahun | `auditor.tewodros.tilahun@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc3 | ACTIVE |
| 71 | `auditor-addis_ababa-tc3-joint-6` | Mesfin Assefa | `auditor.mesfin.assefa@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc3 | ACTIVE |
| 72 | `auditor-addis_ababa-tc3-joint-7` | Fikremariam Girma | `auditor.fikremariam.girma@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc3 | ACTIVE |
| 73 | `auditor-addis_ababa-tc3-joint-8` | Saron Belay | `auditor.saron.belay@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc3 | ACTIVE |
| 74 | `auditor-addis_ababa-tc3-joint-9` | Michael Tadesse | `auditor.michael.tadesse@mor.gov.et` | JOINT_AUDIT | addis_ababa-tc3 | ACTIVE |
| 75 | `auditor-addis_ababa-tc3-tp-1-1` | Almaz Getachew | `auditor.almaz.getachew@mor.gov.et` | TRANSFER_PRICING | addis_ababa-tc3 | ACTIVE |
| 76 | `auditor-addis_ababa-tc3-tp-1-2` | Tigist Tesfa | `auditor.tigist.tesfa@mor.gov.et` | TRANSFER_PRICING | addis_ababa-tc3 | ACTIVE |
| 77 | `auditor-addis_ababa-tc3-tp-2-1` | Tigist Belay | `auditor.tigist.belay@mor.gov.et` | TRANSFER_PRICING | addis_ababa-tc3 | ACTIVE |
| 78 | `auditor-addis_ababa-tc3-tp-2-2` | Ephrem Tadesse | `auditor.ephrem.tadesse@mor.gov.et` | TRANSFER_PRICING | addis_ababa-tc3 | ACTIVE |
| 79 | `auditor-amhara-tc1-comp-1-1` | Ephrem Lemma | `auditor.ephrem.lemma2@mor.gov.et` | COMPREHENSIVE_AUDIT | amhara-tc1 | ACTIVE |
| 80 | `auditor-amhara-tc1-comp-1-2` | Abdi Gebre | `auditor.abdi.gebre2@mor.gov.et` | COMPREHENSIVE_AUDIT | amhara-tc1 | ACTIVE |
| 81 | `auditor-amhara-tc1-comp-2-1` | Abdi Wakjira | `auditor.abdi.wakjira2@mor.gov.et` | COMPREHENSIVE_AUDIT | amhara-tc1 | ACTIVE |
| 82 | `auditor-amhara-tc1-comp-2-2` | Hassen Mengistu | `auditor.hassen.mengistu2@mor.gov.et` | COMPREHENSIVE_AUDIT | amhara-tc1 | ACTIVE |
| 83 | `auditor-amhara-tc1-desk-1-1` | Selam Yohannes | `auditor.selam.yohannes@mor.gov.et` | DESK_AUDIT | amhara-tc1 | ACTIVE |
| 84 | `auditor-amhara-tc1-desk-1-2` | Bereket Mideksa | `auditor.bereket.mideksa@mor.gov.et` | DESK_AUDIT | amhara-tc1 | ACTIVE |
| 85 | `auditor-amhara-tc1-desk-2-1` | Bereket Assefa | `auditor.bereket.assefa@mor.gov.et` | DESK_AUDIT | amhara-tc1 | ACTIVE |
| 86 | `auditor-amhara-tc1-desk-2-2` | Solomon Girma | `auditor.solomon.girma@mor.gov.et` | DESK_AUDIT | amhara-tc1 | ACTIVE |
| 87 | `auditor-amhara-tc1-issue-1-1` | Eden Tadesse | `auditor.eden.tadesse2@mor.gov.et` | ISSUE_AUDIT | amhara-tc1 | ACTIVE |
| 88 | `auditor-amhara-tc1-issue-1-2` | Samuel Belay | `auditor.samuel.belay@mor.gov.et` | ISSUE_AUDIT | amhara-tc1 | ACTIVE |
| 89 | `auditor-amhara-tc1-issue-2-1` | Samuel Tesfa | `auditor.samuel.tesfa@mor.gov.et` | ISSUE_AUDIT | amhara-tc1 | ACTIVE |
| 90 | `auditor-amhara-tc1-issue-2-2` | Yodit Getachew | `auditor.yodit.getachew@mor.gov.et` | ISSUE_AUDIT | amhara-tc1 | ACTIVE |
| 91 | `auditor-amhara-tc1-joint-1` | Seble Bekele | `auditor.seble.bekele@mor.gov.et` | JOINT_AUDIT | amhara-tc1 | ACTIVE |
| 92 | `auditor-amhara-tc1-joint-10` | Meron Bikila | `auditor.meron.bikila@mor.gov.et` | JOINT_AUDIT | amhara-tc1 | ACTIVE |
| 93 | `auditor-amhara-tc1-joint-2` | Henok Alemu | `auditor.henok.alemu@mor.gov.et` | JOINT_AUDIT | amhara-tc1 | ACTIVE |
| 94 | `auditor-amhara-tc1-joint-3` | Genet Tesfa | `auditor.genet.tesfa@mor.gov.et` | JOINT_AUDIT | amhara-tc1 | ACTIVE |
| 95 | `auditor-amhara-tc1-joint-4` | Birtukan Getachew | `auditor.birtukan.getachew@mor.gov.et` | JOINT_AUDIT | amhara-tc1 | ACTIVE |
| 96 | `auditor-amhara-tc1-joint-5` | Lalisa Mideksa | `auditor.lalisa.mideksa2@mor.gov.et` | JOINT_AUDIT | amhara-tc1 | ACTIVE |
| 97 | `auditor-amhara-tc1-joint-6` | Dereje Yohannes | `auditor.dereje.yohannes@mor.gov.et` | JOINT_AUDIT | amhara-tc1 | ACTIVE |
| 98 | `auditor-amhara-tc1-joint-7` | Mekdes Hassan | `auditor.mekdes.hassan@mor.gov.et` | JOINT_AUDIT | amhara-tc1 | ACTIVE |
| 99 | `auditor-amhara-tc1-joint-8` | Tirhas Mengistu | `auditor.tirhas.mengistu@mor.gov.et` | JOINT_AUDIT | amhara-tc1 | ACTIVE |
| 100 | `auditor-amhara-tc1-joint-9` | Kassahun Wakjira | `auditor.kassahun.wakjira@mor.gov.et` | JOINT_AUDIT | amhara-tc1 | ACTIVE |
| 101 | `auditor-amhara-tc1-tp-1-1` | Mesfin Alemayehu | `auditor.mesfin.alemayehu@mor.gov.et` | TRANSFER_PRICING | amhara-tc1 | ACTIVE |
| 102 | `auditor-amhara-tc1-tp-1-2` | Fikremariam Banti | `auditor.fikremariam.banti@mor.gov.et` | TRANSFER_PRICING | amhara-tc1 | ACTIVE |
| 103 | `auditor-amhara-tc1-tp-2-1` | Fikremariam Alemu | `auditor.fikremariam.alemu@mor.gov.et` | TRANSFER_PRICING | amhara-tc1 | ACTIVE |
| 104 | `auditor-amhara-tc1-tp-2-2` | Saron Bekele | `auditor.saron.bekele@mor.gov.et` | TRANSFER_PRICING | amhara-tc1 | ACTIVE |
| 105 | `auditor-amhara-tc2-comp-1-1` | Yosef Gebre | `auditor.yosef.gebre@mor.gov.et` | COMPREHENSIVE_AUDIT | amhara-tc2 | ACTIVE |
| 106 | `auditor-amhara-tc2-comp-1-2` | Eleni Abera | `auditor.eleni.abera@mor.gov.et` | COMPREHENSIVE_AUDIT | amhara-tc2 | ACTIVE |
| 107 | `auditor-amhara-tc2-comp-2-1` | Eleni Mengistu | `auditor.eleni.mengistu@mor.gov.et` | COMPREHENSIVE_AUDIT | amhara-tc2 | ACTIVE |
| 108 | `auditor-amhara-tc2-comp-2-2` | Nardos Hassan | `auditor.nardos.hassan@mor.gov.et` | COMPREHENSIVE_AUDIT | amhara-tc2 | ACTIVE |
| 109 | `auditor-amhara-tc2-desk-1-1` | Meseret Mideksa | `auditor.meseret.mideksa@mor.gov.et` | DESK_AUDIT | amhara-tc2 | ACTIVE |
| 110 | `auditor-amhara-tc2-desk-1-2` | Amanuel Getachew | `auditor.amanuel.getachew@mor.gov.et` | DESK_AUDIT | amhara-tc2 | ACTIVE |
| 111 | `auditor-amhara-tc2-desk-2-1` | Amanuel Girma | `auditor.amanuel.girma@mor.gov.et` | DESK_AUDIT | amhara-tc2 | ACTIVE |
| 112 | `auditor-amhara-tc2-desk-2-2` | Ruth Belay | `auditor.ruth.belay@mor.gov.et` | DESK_AUDIT | amhara-tc2 | ACTIVE |
| 113 | `auditor-amhara-tc2-issue-1-1` | Getnet Wolde | `auditor.getnet.wolde@mor.gov.et` | ISSUE_AUDIT | amhara-tc2 | ACTIVE |
| 114 | `auditor-amhara-tc2-issue-1-2` | Gemechu Berhane | `auditor.gemechu.berhane@mor.gov.et` | ISSUE_AUDIT | amhara-tc2 | ACTIVE |
| 115 | `auditor-amhara-tc2-issue-2-1` | Gemechu Yohannes | `auditor.gemechu.yohannes@mor.gov.et` | ISSUE_AUDIT | amhara-tc2 | ACTIVE |
| 116 | `auditor-amhara-tc2-issue-2-2` | Ibrahim Mideksa | `auditor.ibrahim.mideksa@mor.gov.et` | ISSUE_AUDIT | amhara-tc2 | ACTIVE |
| 117 | `auditor-amhara-tc2-joint-1` | Henok Alemu | `auditor.henok.alemu2@mor.gov.et` | JOINT_AUDIT | amhara-tc2 | ACTIVE |
| 118 | `auditor-amhara-tc2-joint-10` | Amanuel Zewde | `auditor.amanuel.zewde@mor.gov.et` | JOINT_AUDIT | amhara-tc2 | ACTIVE |
| 119 | `auditor-amhara-tc2-joint-2` | Seble Bekele | `auditor.seble.bekele2@mor.gov.et` | JOINT_AUDIT | amhara-tc2 | ACTIVE |
| 120 | `auditor-amhara-tc2-joint-3` | Sara Kebede | `auditor.sara.kebede@mor.gov.et` | JOINT_AUDIT | amhara-tc2 | ACTIVE |
| 121 | `auditor-amhara-tc2-joint-4` | Fikadu Mekonnen | `auditor.fikadu.mekonnen@mor.gov.et` | JOINT_AUDIT | amhara-tc2 | ACTIVE |
| 122 | `auditor-amhara-tc2-joint-5` | Bethlehem Tilahun | `auditor.bethlehem.tilahun@mor.gov.et` | JOINT_AUDIT | amhara-tc2 | ACTIVE |
| 123 | `auditor-amhara-tc2-joint-6` | Yosef Assefa | `auditor.yosef.assefa@mor.gov.et` | JOINT_AUDIT | amhara-tc2 | ACTIVE |
| 124 | `auditor-amhara-tc2-joint-7` | Eleni Girma | `auditor.eleni.girma@mor.gov.et` | JOINT_AUDIT | amhara-tc2 | ACTIVE |
| 125 | `auditor-amhara-tc2-joint-8` | Nardos Belay | `auditor.nardos.belay@mor.gov.et` | JOINT_AUDIT | amhara-tc2 | ACTIVE |
| 126 | `auditor-amhara-tc2-joint-9` | Addis Tadesse | `auditor.addis.tadesse@mor.gov.et` | JOINT_AUDIT | amhara-tc2 | ACTIVE |
| 127 | `auditor-amhara-tc2-tp-1-1` | Solomon Tadesse | `auditor.solomon.tadesse@mor.gov.et` | TRANSFER_PRICING | amhara-tc2 | ACTIVE |
| 128 | `auditor-amhara-tc2-tp-1-2` | Getnet Mamo | `auditor.getnet.mamo@mor.gov.et` | TRANSFER_PRICING | amhara-tc2 | ACTIVE |
| 129 | `auditor-amhara-tc2-tp-2-1` | Getnet Mulugeta | `auditor.getnet.mulugeta@mor.gov.et` | TRANSFER_PRICING | amhara-tc2 | ACTIVE |
| 130 | `auditor-amhara-tc2-tp-2-2` | Gemechu Lemma | `auditor.gemechu.lemma@mor.gov.et` | TRANSFER_PRICING | amhara-tc2 | ACTIVE |
| 131 | `auditor-amhara-tc3-comp-1-1` | Mulugeta Kassa | `auditor.mulugeta.kassa@mor.gov.et` | COMPREHENSIVE_AUDIT | amhara-tc3 | ACTIVE |
| 132 | `auditor-amhara-tc3-comp-1-2` | Diriba Mamo | `auditor.diriba.mamo@mor.gov.et` | COMPREHENSIVE_AUDIT | amhara-tc3 | ACTIVE |
| 133 | `auditor-amhara-tc3-comp-2-1` | Diriba Bekele | `auditor.diriba.bekele@mor.gov.et` | COMPREHENSIVE_AUDIT | amhara-tc3 | ACTIVE |
| 134 | `auditor-amhara-tc3-comp-2-2` | Tolera Alemu | `auditor.tolera.alemu@mor.gov.et` | COMPREHENSIVE_AUDIT | amhara-tc3 | ACTIVE |
| 135 | `auditor-amhara-tc3-desk-1-1` | Dawit Getachew | `auditor.dawit.getachew@mor.gov.et` | DESK_AUDIT | amhara-tc3 | ACTIVE |
| 136 | `auditor-amhara-tc3-desk-1-2` | Meron Tesfa | `auditor.meron.tesfa@mor.gov.et` | DESK_AUDIT | amhara-tc3 | ACTIVE |
| 137 | `auditor-amhara-tc3-desk-2-1` | Meron Belay | `auditor.meron.belay@mor.gov.et` | DESK_AUDIT | amhara-tc3 | ACTIVE |
| 138 | `auditor-amhara-tc3-desk-2-2` | Selam Tadesse | `auditor.selam.tadesse@mor.gov.et` | DESK_AUDIT | amhara-tc3 | ACTIVE |
| 139 | `auditor-amhara-tc3-issue-1-1` | Yodit Mengistu | `auditor.yodit.mengistu@mor.gov.et` | ISSUE_AUDIT | amhara-tc3 | ACTIVE |
| 140 | `auditor-amhara-tc3-issue-1-2` | Natnael Wakjira | `auditor.natnael.wakjira@mor.gov.et` | ISSUE_AUDIT | amhara-tc3 | ACTIVE |
| 141 | `auditor-amhara-tc3-issue-2-1` | Natnael Gebre | `auditor.natnael.gebre@mor.gov.et` | ISSUE_AUDIT | amhara-tc3 | ACTIVE |
| 142 | `auditor-amhara-tc3-issue-2-2` | Robel Lemma | `auditor.robel.lemma@mor.gov.et` | ISSUE_AUDIT | amhara-tc3 | ACTIVE |
| 143 | `auditor-amhara-tc3-joint-1` | Genet Mamo | `auditor.genet.mamo2@mor.gov.et` | JOINT_AUDIT | amhara-tc3 | ACTIVE |
| 144 | `auditor-amhara-tc3-joint-10` | Bereket Negash | `auditor.bereket.negash@mor.gov.et` | JOINT_AUDIT | amhara-tc3 | ACTIVE |
| 145 | `auditor-amhara-tc3-joint-2` | Birtukan Tadesse | `auditor.birtukan.tadesse2@mor.gov.et` | JOINT_AUDIT | amhara-tc3 | ACTIVE |
| 146 | `auditor-amhara-tc3-joint-3` | Lalisa Belay | `auditor.lalisa.belay@mor.gov.et` | JOINT_AUDIT | amhara-tc3 | ACTIVE |
| 147 | `auditor-amhara-tc3-joint-4` | Dereje Girma | `auditor.dereje.girma@mor.gov.et` | JOINT_AUDIT | amhara-tc3 | ACTIVE |
| 148 | `auditor-amhara-tc3-joint-5` | Mekdes Assefa | `auditor.mekdes.assefa@mor.gov.et` | JOINT_AUDIT | amhara-tc3 | ACTIVE |
| 149 | `auditor-amhara-tc3-joint-6` | Tirhas Tilahun | `auditor.tirhas.tilahun@mor.gov.et` | JOINT_AUDIT | amhara-tc3 | ACTIVE |
| 150 | `auditor-amhara-tc3-joint-7` | Kassahun Mekonnen | `auditor.kassahun.mekonnen@mor.gov.et` | JOINT_AUDIT | amhara-tc3 | ACTIVE |
| 151 | `auditor-amhara-tc3-joint-8` | Fatuma Kebede | `auditor.fatuma.kebede@mor.gov.et` | JOINT_AUDIT | amhara-tc3 | ACTIVE |
| 152 | `auditor-amhara-tc3-joint-9` | Chaltu Bekele | `auditor.chaltu.bekele@mor.gov.et` | JOINT_AUDIT | amhara-tc3 | ACTIVE |
| 153 | `auditor-amhara-tc3-tp-1-1` | Meron Desta | `auditor.meron.desta2@mor.gov.et` | TRANSFER_PRICING | amhara-tc3 | ACTIVE |
| 154 | `auditor-amhara-tc3-tp-1-2` | Dawit Berhane | `auditor.dawit.berhane@mor.gov.et` | TRANSFER_PRICING | amhara-tc3 | ACTIVE |
| 155 | `auditor-amhara-tc3-tp-2-1` | Dawit Zewde | `auditor.dawit.zewde@mor.gov.et` | TRANSFER_PRICING | amhara-tc3 | ACTIVE |
| 156 | `auditor-amhara-tc3-tp-2-2` | Haile Negash | `auditor.haile.negash@mor.gov.et` | TRANSFER_PRICING | amhara-tc3 | ACTIVE |
| 157 | `auditor-dire_dawa-tc1-comp-1-1` | Kassa Abera | `auditor.kassa.abera@mor.gov.et` | COMPREHENSIVE_AUDIT | dire_dawa-tc1 | ACTIVE |
| 158 | `auditor-dire_dawa-tc1-comp-1-2` | Mamo Gebre | `auditor.mamo.gebre@mor.gov.et` | COMPREHENSIVE_AUDIT | dire_dawa-tc1 | ACTIVE |
| 159 | `auditor-dire_dawa-tc1-comp-2-1` | Mamo Worku | `auditor.mamo.worku@mor.gov.et` | COMPREHENSIVE_AUDIT | dire_dawa-tc1 | ACTIVE |
| 160 | `auditor-dire_dawa-tc1-comp-2-2` | Hassen Kassa | `auditor.hassen.kassa@mor.gov.et` | COMPREHENSIVE_AUDIT | dire_dawa-tc1 | ACTIVE |
| 161 | `auditor-dire_dawa-tc1-desk-1-1` | Abebe Berhane | `auditor.abebe.berhane@mor.gov.et` | DESK_AUDIT | dire_dawa-tc1 | ACTIVE |
| 162 | `auditor-dire_dawa-tc1-desk-1-2` | Almaw Desta | `auditor.almaw.desta@mor.gov.et` | DESK_AUDIT | dire_dawa-tc1 | ACTIVE |
| 163 | `auditor-dire_dawa-tc1-desk-2-1` | Almaw Mideksa | `auditor.almaw.mideksa@mor.gov.et` | DESK_AUDIT | dire_dawa-tc1 | ACTIVE |
| 164 | `auditor-dire_dawa-tc1-desk-2-2` | Tadesse Getachew | `auditor.tadesse.getachew@mor.gov.et` | DESK_AUDIT | dire_dawa-tc1 | ACTIVE |
| 165 | `auditor-dire_dawa-tc1-issue-1-1` | Birtukan Girma | `auditor.birtukan.girma@mor.gov.et` | ISSUE_AUDIT | dire_dawa-tc1 | ACTIVE |
| 166 | `auditor-dire_dawa-tc1-issue-1-2` | Lalisa Assefa | `auditor.lalisa.assefa@mor.gov.et` | ISSUE_AUDIT | dire_dawa-tc1 | ACTIVE |
| 167 | `auditor-dire_dawa-tc1-issue-2-1` | Lalisa Mideksa | `auditor.lalisa.mideksa3@mor.gov.et` | ISSUE_AUDIT | dire_dawa-tc1 | ACTIVE |
| 168 | `auditor-dire_dawa-tc1-issue-2-2` | Dereje Yohannes | `auditor.dereje.yohannes2@mor.gov.et` | ISSUE_AUDIT | dire_dawa-tc1 | ACTIVE |
| 169 | `auditor-dire_dawa-tc1-joint-1` | Bereket Mekonnen | `auditor.bereket.mekonnen2@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc1 | ACTIVE |
| 170 | `auditor-dire_dawa-tc1-joint-10` | Genet Desta | `auditor.genet.desta@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc1 | ACTIVE |
| 171 | `auditor-dire_dawa-tc1-joint-2` | Selam Kebede | `auditor.selam.kebede@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc1 | ACTIVE |
| 172 | `auditor-dire_dawa-tc1-joint-3` | Meron Bekele | `auditor.meron.bekele@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc1 | ACTIVE |
| 173 | `auditor-dire_dawa-tc1-joint-4` | Dawit Alemu | `auditor.dawit.alemu@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc1 | ACTIVE |
| 174 | `auditor-dire_dawa-tc1-joint-5` | Haile Tesfa | `auditor.haile.tesfa@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc1 | ACTIVE |
| 175 | `auditor-dire_dawa-tc1-joint-6` | Tekle Getachew | `auditor.tekle.getachew@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc1 | ACTIVE |
| 176 | `auditor-dire_dawa-tc1-joint-7` | Bikila Mideksa | `auditor.bikila.mideksa@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc1 | ACTIVE |
| 177 | `auditor-dire_dawa-tc1-joint-8` | Kassa Yohannes | `auditor.kassa.yohannes@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc1 | ACTIVE |
| 178 | `auditor-dire_dawa-tc1-joint-9` | Mamo Hassan | `auditor.mamo.hassan@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc1 | ACTIVE |
| 179 | `auditor-dire_dawa-tc1-tp-1-1` | Lalisa Belay | `auditor.lalisa.belay2@mor.gov.et` | TRANSFER_PRICING | dire_dawa-tc1 | ACTIVE |
| 180 | `auditor-dire_dawa-tc1-tp-1-2` | Dereje Girma | `auditor.dereje.girma2@mor.gov.et` | TRANSFER_PRICING | dire_dawa-tc1 | ACTIVE |
| 181 | `auditor-dire_dawa-tc1-tp-2-1` | Dereje Getachew | `auditor.dereje.getachew@mor.gov.et` | TRANSFER_PRICING | dire_dawa-tc1 | ACTIVE |
| 182 | `auditor-dire_dawa-tc1-tp-2-2` | Mekdes Mideksa | `auditor.mekdes.mideksa@mor.gov.et` | TRANSFER_PRICING | dire_dawa-tc1 | ACTIVE |
| 183 | `auditor-dire_dawa-tc2-comp-1-1` | Natnael Gebre | `auditor.natnael.gebre2@mor.gov.et` | COMPREHENSIVE_AUDIT | dire_dawa-tc2 | ACTIVE |
| 184 | `auditor-dire_dawa-tc2-comp-1-2` | Robel Lemma | `auditor.robel.lemma2@mor.gov.et` | COMPREHENSIVE_AUDIT | dire_dawa-tc2 | ACTIVE |
| 185 | `auditor-dire_dawa-tc2-comp-2-1` | Robel Kassa | `auditor.robel.kassa@mor.gov.et` | COMPREHENSIVE_AUDIT | dire_dawa-tc2 | ACTIVE |
| 186 | `auditor-dire_dawa-tc2-comp-2-2` | Kidist Mamo | `auditor.kidist.mamo@mor.gov.et` | COMPREHENSIVE_AUDIT | dire_dawa-tc2 | ACTIVE |
| 187 | `auditor-dire_dawa-tc2-desk-1-1` | Genet Desta | `auditor.genet.desta2@mor.gov.et` | DESK_AUDIT | dire_dawa-tc2 | ACTIVE |
| 188 | `auditor-dire_dawa-tc2-desk-1-2` | Henok Kifle | `auditor.henok.kifle@mor.gov.et` | DESK_AUDIT | dire_dawa-tc2 | ACTIVE |
| 189 | `auditor-dire_dawa-tc2-desk-2-1` | Henok Getachew | `auditor.henok.getachew@mor.gov.et` | DESK_AUDIT | dire_dawa-tc2 | ACTIVE |
| 190 | `auditor-dire_dawa-tc2-desk-2-2` | Seble Tesfa | `auditor.seble.tesfa@mor.gov.et` | DESK_AUDIT | dire_dawa-tc2 | ACTIVE |
| 191 | `auditor-dire_dawa-tc2-issue-1-1` | Fikadu Desta | `auditor.fikadu.desta@mor.gov.et` | ISSUE_AUDIT | dire_dawa-tc2 | ACTIVE |
| 192 | `auditor-dire_dawa-tc2-issue-1-2` | Bethlehem Kifle | `auditor.bethlehem.kifle@mor.gov.et` | ISSUE_AUDIT | dire_dawa-tc2 | ACTIVE |
| 193 | `auditor-dire_dawa-tc2-issue-2-1` | Bethlehem Getachew | `auditor.bethlehem.getachew@mor.gov.et` | ISSUE_AUDIT | dire_dawa-tc2 | ACTIVE |
| 194 | `auditor-dire_dawa-tc2-issue-2-2` | Yosef Tesfa | `auditor.yosef.tesfa@mor.gov.et` | ISSUE_AUDIT | dire_dawa-tc2 | ACTIVE |
| 195 | `auditor-dire_dawa-tc2-joint-1` | Amanuel Getachew | `auditor.amanuel.getachew2@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc2 | ACTIVE |
| 196 | `auditor-dire_dawa-tc2-joint-10` | Abebe Banti | `auditor.abebe.banti@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc2 | ACTIVE |
| 197 | `auditor-dire_dawa-tc2-joint-2` | Ruth Tesfa | `auditor.ruth.tesfa@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc2 | ACTIVE |
| 198 | `auditor-dire_dawa-tc2-joint-3` | Tewodros Alemu | `auditor.tewodros.alemu@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc2 | ACTIVE |
| 199 | `auditor-dire_dawa-tc2-joint-4` | Mesfin Bekele | `auditor.mesfin.bekele@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc2 | ACTIVE |
| 200 | `auditor-dire_dawa-tc2-joint-5` | Fikremariam Kebede | `auditor.fikremariam.kebede@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc2 | ACTIVE |
| 201 | `auditor-dire_dawa-tc2-joint-6` | Saron Mekonnen | `auditor.saron.mekonnen@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc2 | ACTIVE |
| 202 | `auditor-dire_dawa-tc2-joint-7` | Michael Tilahun | `auditor.michael.tilahun@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc2 | ACTIVE |
| 203 | `auditor-dire_dawa-tc2-joint-8` | Eyerusalem Assefa | `auditor.eyerusalem.assefa@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc2 | ACTIVE |
| 204 | `auditor-dire_dawa-tc2-joint-9` | Abdi Girma | `auditor.abdi.girma@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc2 | ACTIVE |
| 205 | `auditor-dire_dawa-tc2-tp-1-1` | Tadesse Girma | `auditor.tadesse.girma@mor.gov.et` | TRANSFER_PRICING | dire_dawa-tc2 | ACTIVE |
| 206 | `auditor-dire_dawa-tc2-tp-1-2` | Workneh Belay | `auditor.workneh.belay@mor.gov.et` | TRANSFER_PRICING | dire_dawa-tc2 | ACTIVE |
| 207 | `auditor-dire_dawa-tc2-tp-2-1` | Workneh Bikila | `auditor.workneh.bikila2@mor.gov.et` | TRANSFER_PRICING | dire_dawa-tc2 | ACTIVE |
| 208 | `auditor-dire_dawa-tc2-tp-2-2` | Almaz Tesfaye | `auditor.almaz.tesfaye@mor.gov.et` | TRANSFER_PRICING | dire_dawa-tc2 | ACTIVE |
| 209 | `auditor-dire_dawa-tc3-comp-1-1` | Tekle Lemma | `auditor.tekle.lemma@mor.gov.et` | COMPREHENSIVE_AUDIT | dire_dawa-tc3 | ACTIVE |
| 210 | `auditor-dire_dawa-tc3-comp-1-2` | Bikila Mulugeta | `auditor.bikila.mulugeta@mor.gov.et` | COMPREHENSIVE_AUDIT | dire_dawa-tc3 | ACTIVE |
| 211 | `auditor-dire_dawa-tc3-comp-2-1` | Bikila Mamo | `auditor.bikila.mamo@mor.gov.et` | COMPREHENSIVE_AUDIT | dire_dawa-tc3 | ACTIVE |
| 212 | `auditor-dire_dawa-tc3-comp-2-2` | Kassa Tadesse | `auditor.kassa.tadesse@mor.gov.et` | COMPREHENSIVE_AUDIT | dire_dawa-tc3 | ACTIVE |
| 213 | `auditor-dire_dawa-tc3-desk-1-1` | Tadesse Girma | `auditor.tadesse.girma2@mor.gov.et` | DESK_AUDIT | dire_dawa-tc3 | ACTIVE |
| 214 | `auditor-dire_dawa-tc3-desk-1-2` | Almaw Assefa | `auditor.almaw.assefa@mor.gov.et` | DESK_AUDIT | dire_dawa-tc3 | ACTIVE |
| 215 | `auditor-dire_dawa-tc3-desk-2-1` | Almaw Mideksa | `auditor.almaw.mideksa2@mor.gov.et` | DESK_AUDIT | dire_dawa-tc3 | ACTIVE |
| 216 | `auditor-dire_dawa-tc3-desk-2-2` | Abebe Yohannes | `auditor.abebe.yohannes@mor.gov.et` | DESK_AUDIT | dire_dawa-tc3 | ACTIVE |
| 217 | `auditor-dire_dawa-tc3-issue-1-1` | Dereje Banti | `auditor.dereje.banti@mor.gov.et` | ISSUE_AUDIT | dire_dawa-tc3 | ACTIVE |
| 218 | `auditor-dire_dawa-tc3-issue-1-2` | Mekdes Alemayehu | `auditor.mekdes.alemayehu@mor.gov.et` | ISSUE_AUDIT | dire_dawa-tc3 | ACTIVE |
| 219 | `auditor-dire_dawa-tc3-issue-2-1` | Mekdes Mulugeta | `auditor.mekdes.mulugeta@mor.gov.et` | ISSUE_AUDIT | dire_dawa-tc3 | ACTIVE |
| 220 | `auditor-dire_dawa-tc3-issue-2-2` | Tirhas Tesfaye | `auditor.tirhas.tesfaye@mor.gov.et` | ISSUE_AUDIT | dire_dawa-tc3 | ACTIVE |
| 221 | `auditor-dire_dawa-tc3-joint-1` | Meron Worku | `auditor.meron.worku@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc3 | ACTIVE |
| 222 | `auditor-dire_dawa-tc3-joint-10` | Genet Wakjira | `auditor.genet.wakjira2@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc3 | ACTIVE |
| 223 | `auditor-dire_dawa-tc3-joint-2` | Dawit Kassa | `auditor.dawit.kassa@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc3 | ACTIVE |
| 224 | `auditor-dire_dawa-tc3-joint-3` | Haile Mamo | `auditor.haile.mamo@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc3 | ACTIVE |
| 225 | `auditor-dire_dawa-tc3-joint-4` | Tekle Tadesse | `auditor.tekle.tadesse@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc3 | ACTIVE |
| 226 | `auditor-dire_dawa-tc3-joint-5` | Bikila Belay | `auditor.bikila.belay@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc3 | ACTIVE |
| 227 | `auditor-dire_dawa-tc3-joint-6` | Kassa Girma | `auditor.kassa.girma@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc3 | ACTIVE |
| 228 | `auditor-dire_dawa-tc3-joint-7` | Mamo Assefa | `auditor.mamo.assefa@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc3 | ACTIVE |
| 229 | `auditor-dire_dawa-tc3-joint-8` | Hassen Tilahun | `auditor.hassen.tilahun@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc3 | ACTIVE |
| 230 | `auditor-dire_dawa-tc3-joint-9` | Abdi Mekonnen | `auditor.abdi.mekonnen@mor.gov.et` | JOINT_AUDIT | dire_dawa-tc3 | ACTIVE |
| 231 | `auditor-dire_dawa-tc3-tp-1-1` | Genet Alemayehu | `auditor.genet.alemayehu@mor.gov.et` | TRANSFER_PRICING | dire_dawa-tc3 | ACTIVE |
| 232 | `auditor-dire_dawa-tc3-tp-1-2` | Birtukan Kifle | `auditor.birtukan.kifle@mor.gov.et` | TRANSFER_PRICING | dire_dawa-tc3 | ACTIVE |
| 233 | `auditor-dire_dawa-tc3-tp-2-1` | Birtukan Tesfaye | `auditor.birtukan.tesfaye@mor.gov.et` | TRANSFER_PRICING | dire_dawa-tc3 | ACTIVE |
| 234 | `auditor-dire_dawa-tc3-tp-2-2` | Lalisa Bikila | `auditor.lalisa.bikila@mor.gov.et` | TRANSFER_PRICING | dire_dawa-tc3 | ACTIVE |
| 235 | `auditor-federal-lto1-comp-1-1` | Saron Mideksa | `auditor.saron.mideksa@mor.gov.et` | COMPREHENSIVE_AUDIT | federal-lto1 | ACTIVE |
| 236 | `auditor-federal-lto1-comp-1-2` | Michael Getachew | `auditor.michael.getachew@mor.gov.et` | COMPREHENSIVE_AUDIT | federal-lto1 | ACTIVE |
| 237 | `auditor-federal-lto1-comp-2-1` | Michael Girma | `auditor.michael.girma@mor.gov.et` | COMPREHENSIVE_AUDIT | federal-lto1 | ACTIVE |
| 238 | `auditor-federal-lto1-comp-2-2` | Eyerusalem Belay | `auditor.eyerusalem.belay@mor.gov.et` | COMPREHENSIVE_AUDIT | federal-lto1 | ACTIVE |
| 239 | `auditor-federal-lto1-desk-1-1` | Tsega Mamo | `auditor.tsega.mamo@mor.gov.et` | DESK_AUDIT | federal-lto1 | ACTIVE |
| 240 | `auditor-federal-lto1-desk-1-2` | Abebe Kassa | `auditor.abebe.kassa@mor.gov.et` | DESK_AUDIT | federal-lto1 | ACTIVE |
| 241 | `auditor-federal-lto1-desk-2-1` | Abebe Lemma | `auditor.abebe.lemma@mor.gov.et` | DESK_AUDIT | federal-lto1 | ACTIVE |
| 242 | `auditor-federal-lto1-desk-2-2` | Almaw Gebre | `auditor.almaw.gebre@mor.gov.et` | DESK_AUDIT | federal-lto1 | ACTIVE |
| 243 | `auditor-federal-lto1-issue-1-1` | Workneh Bekele | `auditor.workneh.bekele@mor.gov.et` | ISSUE_AUDIT | federal-lto1 | ACTIVE |
| 244 | `auditor-federal-lto1-issue-1-2` | Almaz Kebede | `auditor.almaz.kebede@mor.gov.et` | ISSUE_AUDIT | federal-lto1 | ACTIVE |
| 245 | `auditor-federal-lto1-issue-2-1` | Almaz Kassa | `auditor.almaz.kassa@mor.gov.et` | ISSUE_AUDIT | federal-lto1 | ACTIVE |
| 246 | `auditor-federal-lto1-issue-2-2` | Tigist Worku | `auditor.tigist.worku@mor.gov.et` | ISSUE_AUDIT | federal-lto1 | ACTIVE |
| 247 | `auditor-federal-lto1-ja-1` | Fikremariam Tilahun | `auditor.fikremariam.tilahun@mor.gov.et` | JOINT_AUDIT | federal-lto1 | ACTIVE |
| 248 | `auditor-federal-lto1-ja-10` | Bereket Mekonnen | `auditor.bereket.mekonnen@mor.gov.et` | JOINT_AUDIT | federal-lto1 | ACTIVE |
| 249 | `auditor-federal-lto1-ja-2` | Saron Assefa | `auditor.saron.assefa@mor.gov.et` | JOINT_AUDIT | federal-lto1 | ACTIVE |
| 250 | `auditor-federal-lto1-ja-3` | Bikila Worku | `auditor.bikila.worku@mor.gov.et` | JOINT_AUDIT | federal-lto1 | ACTIVE |
| 251 | `auditor-federal-lto1-ja-4` | Michael Zewde | `auditor.michael.zewde@mor.gov.et` | JOINT_AUDIT | federal-lto1 | ACTIVE |
| 252 | `auditor-federal-lto1-ja-5` | Saron Negash | `auditor.saron.negash@mor.gov.et` | JOINT_AUDIT | federal-lto1 | ACTIVE |
| 253 | `auditor-federal-lto1-ja-6` | Almaw Tesfa | `auditor.almaw.tesfa@mor.gov.et` | JOINT_AUDIT | federal-lto1 | ACTIVE |
| 254 | `auditor-federal-lto1-ja-7` | Tigist Alemu | `auditor.tigist.alemu@mor.gov.et` | JOINT_AUDIT | federal-lto1 | ACTIVE |
| 255 | `auditor-federal-lto1-ja-8` | Ephrem Bekele | `auditor.ephrem.bekele@mor.gov.et` | JOINT_AUDIT | federal-lto1 | ACTIVE |
| 256 | `auditor-federal-lto1-ja-9` | Meron Kebede | `auditor.meron.kebede@mor.gov.et` | JOINT_AUDIT | federal-lto1 | ACTIVE |
| 257 | `auditor-federal-lto1-tp-1-1` | Sara Tesfaye | `auditor.sara.tesfaye@mor.gov.et` | TRANSFER_PRICING | federal-lto1 | ACTIVE |
| 258 | `auditor-federal-lto1-tp-1-2` | Fikadu Mulugeta | `auditor.fikadu.mulugeta@mor.gov.et` | TRANSFER_PRICING | federal-lto1 | ACTIVE |
| 259 | `auditor-federal-lto1-tp-2-1` | Fikadu Alemayehu | `auditor.fikadu.alemayehu@mor.gov.et` | TRANSFER_PRICING | federal-lto1 | ACTIVE |
| 260 | `auditor-federal-lto1-tp-2-2` | Bethlehem Banti | `auditor.bethlehem.banti@mor.gov.et` | TRANSFER_PRICING | federal-lto1 | ACTIVE |
| 261 | `auditor-federal-lto2-comp-1-1` | Gemechu Getachew | `auditor.gemechu.getachew@mor.gov.et` | COMPREHENSIVE_AUDIT | federal-lto2 | ACTIVE |
| 262 | `auditor-federal-lto2-comp-1-2` | Ibrahim Tesfa | `auditor.ibrahim.tesfa@mor.gov.et` | COMPREHENSIVE_AUDIT | federal-lto2 | ACTIVE |
| 263 | `auditor-federal-lto2-comp-2-1` | Ibrahim Belay | `auditor.ibrahim.belay@mor.gov.et` | COMPREHENSIVE_AUDIT | federal-lto2 | ACTIVE |
| 264 | `auditor-federal-lto2-comp-2-2` | Yonas Tadesse | `auditor.yonas.tadesse@mor.gov.et` | COMPREHENSIVE_AUDIT | federal-lto2 | ACTIVE |
| 265 | `auditor-federal-lto2-desk-1-1` | Birtukan Kassa | `auditor.birtukan.kassa@mor.gov.et` | DESK_AUDIT | federal-lto2 | ACTIVE |
| 266 | `auditor-federal-lto2-desk-1-2` | Genet Worku | `auditor.genet.worku@mor.gov.et` | DESK_AUDIT | federal-lto2 | ACTIVE |
| 267 | `auditor-federal-lto2-desk-2-1` | Genet Gebre | `auditor.genet.gebre@mor.gov.et` | DESK_AUDIT | federal-lto2 | ACTIVE |
| 268 | `auditor-federal-lto2-desk-2-2` | Henok Abera | `auditor.henok.abera@mor.gov.et` | DESK_AUDIT | federal-lto2 | ACTIVE |
| 269 | `auditor-federal-lto2-issue-1-1` | Mulugeta Zewde | `auditor.mulugeta.zewde@mor.gov.et` | ISSUE_AUDIT | federal-lto2 | ACTIVE |
| 270 | `auditor-federal-lto2-issue-1-2` | Diriba Negash | `auditor.diriba.negash@mor.gov.et` | ISSUE_AUDIT | federal-lto2 | ACTIVE |
| 271 | `auditor-federal-lto2-issue-2-1` | Diriba Assefa | `auditor.diriba.assefa@mor.gov.et` | ISSUE_AUDIT | federal-lto2 | ACTIVE |
| 272 | `auditor-federal-lto2-issue-2-2` | Tolera Tilahun | `auditor.tolera.tilahun@mor.gov.et` | ISSUE_AUDIT | federal-lto2 | ACTIVE |
| 273 | `auditor-federal-lto2-ja-1` | Dawit Mengistu | `auditor.dawit.mengistu@mor.gov.et` | JOINT_AUDIT | federal-lto2 | ACTIVE |
| 274 | `auditor-federal-lto2-ja-10` | Getnet Alemayehu | `auditor.getnet.alemayehu@mor.gov.et` | JOINT_AUDIT | federal-lto2 | ACTIVE |
| 275 | `auditor-federal-lto2-ja-2` | Eden Tadesse | `auditor.eden.tadesse@mor.gov.et` | JOINT_AUDIT | federal-lto2 | ACTIVE |
| 276 | `auditor-federal-lto2-ja-3` | Henok Girma | `auditor.henok.girma@mor.gov.et` | JOINT_AUDIT | federal-lto2 | ACTIVE |
| 277 | `auditor-federal-lto2-ja-4` | Meron Kebede | `auditor.meron.kebede2@mor.gov.et` | JOINT_AUDIT | federal-lto2 | ACTIVE |
| 278 | `auditor-federal-lto2-ja-5` | Natnael Assefa | `auditor.natnael.assefa@mor.gov.et` | JOINT_AUDIT | federal-lto2 | ACTIVE |
| 279 | `auditor-federal-lto2-ja-6` | Fikadu Wolde | `auditor.fikadu.wolde@mor.gov.et` | JOINT_AUDIT | federal-lto2 | ACTIVE |
| 280 | `auditor-federal-lto2-ja-7` | Genet Alemu | `auditor.genet.alemu@mor.gov.et` | JOINT_AUDIT | federal-lto2 | ACTIVE |
| 281 | `auditor-federal-lto2-ja-8` | Habtamu Desta | `auditor.habtamu.desta@mor.gov.et` | JOINT_AUDIT | federal-lto2 | ACTIVE |
| 282 | `auditor-federal-lto2-ja-9` | Selam Haile | `auditor.selam.haile@mor.gov.et` | JOINT_AUDIT | federal-lto2 | ACTIVE |
| 283 | `auditor-federal-lto2-tp-1-1` | Tsega Bikila | `auditor.tsega.bikila@mor.gov.et` | TRANSFER_PRICING | federal-lto2 | ACTIVE |
| 284 | `auditor-federal-lto2-tp-1-2` | Berihun Zewde | `auditor.berihun.zewde@mor.gov.et` | TRANSFER_PRICING | federal-lto2 | ACTIVE |
| 285 | `auditor-federal-lto2-tp-2-1` | Berihun Girma | `auditor.berihun.girma@mor.gov.et` | TRANSFER_PRICING | federal-lto2 | ACTIVE |
| 286 | `auditor-federal-lto2-tp-2-2` | Rahel Assefa | `auditor.rahel.assefa@mor.gov.et` | TRANSFER_PRICING | federal-lto2 | ACTIVE |
| 287 | `auditor-oromia-tc1-comp-1-1` | Genet Assefa | `auditor.genet.assefa@mor.gov.et` | COMPREHENSIVE_AUDIT | oromia-tc1 | ACTIVE |
| 288 | `auditor-oromia-tc1-comp-1-2` | Birtukan Tilahun | `auditor.birtukan.tilahun@mor.gov.et` | COMPREHENSIVE_AUDIT | oromia-tc1 | ACTIVE |
| 289 | `auditor-oromia-tc1-comp-2-1` | Birtukan Yohannes | `auditor.birtukan.yohannes@mor.gov.et` | COMPREHENSIVE_AUDIT | oromia-tc1 | ACTIVE |
| 290 | `auditor-oromia-tc1-comp-2-2` | Lalisa Hassan | `auditor.lalisa.hassan@mor.gov.et` | COMPREHENSIVE_AUDIT | oromia-tc1 | ACTIVE |
| 291 | `auditor-oromia-tc1-desk-1-1` | Natnael Mekonnen | `auditor.natnael.mekonnen@mor.gov.et` | DESK_AUDIT | oromia-tc1 | ACTIVE |
| 292 | `auditor-oromia-tc1-desk-1-2` | Yodit Tilahun | `auditor.yodit.tilahun@mor.gov.et` | DESK_AUDIT | oromia-tc1 | ACTIVE |
| 293 | `auditor-oromia-tc1-desk-2-1` | Yodit Haile | `auditor.yodit.haile@mor.gov.et` | DESK_AUDIT | oromia-tc1 | ACTIVE |
| 294 | `auditor-oromia-tc1-desk-2-2` | Samuel Negash | `auditor.samuel.negash@mor.gov.et` | DESK_AUDIT | oromia-tc1 | ACTIVE |
| 295 | `auditor-oromia-tc1-issue-1-1` | Kidist Mekonnen | `auditor.kidist.mekonnen@mor.gov.et` | ISSUE_AUDIT | oromia-tc1 | ACTIVE |
| 296 | `auditor-oromia-tc1-issue-1-2` | Addis Kebede | `auditor.addis.kebede@mor.gov.et` | ISSUE_AUDIT | oromia-tc1 | ACTIVE |
| 297 | `auditor-oromia-tc1-issue-2-1` | Addis Mengistu | `auditor.addis.mengistu@mor.gov.et` | ISSUE_AUDIT | oromia-tc1 | ACTIVE |
| 298 | `auditor-oromia-tc1-issue-2-2` | Nardos Wakjira | `auditor.nardos.wakjira@mor.gov.et` | ISSUE_AUDIT | oromia-tc1 | ACTIVE |
| 299 | `auditor-oromia-tc1-joint-1` | Bethlehem Yohannes | `auditor.bethlehem.yohannes@mor.gov.et` | JOINT_AUDIT | oromia-tc1 | ACTIVE |
| 300 | `auditor-oromia-tc1-joint-10` | Fikremariam Tadesse | `auditor.fikremariam.tadesse@mor.gov.et` | JOINT_AUDIT | oromia-tc1 | ACTIVE |
| 301 | `auditor-oromia-tc1-joint-2` | Yosef Mideksa | `auditor.yosef.mideksa@mor.gov.et` | JOINT_AUDIT | oromia-tc1 | ACTIVE |
| 302 | `auditor-oromia-tc1-joint-3` | Eleni Getachew | `auditor.eleni.getachew@mor.gov.et` | JOINT_AUDIT | oromia-tc1 | ACTIVE |
| 303 | `auditor-oromia-tc1-joint-4` | Nardos Tesfa | `auditor.nardos.tesfa@mor.gov.et` | JOINT_AUDIT | oromia-tc1 | ACTIVE |
| 304 | `auditor-oromia-tc1-joint-5` | Addis Alemu | `auditor.addis.alemu@mor.gov.et` | JOINT_AUDIT | oromia-tc1 | ACTIVE |
| 305 | `auditor-oromia-tc1-joint-6` | Kidist Bekele | `auditor.kidist.bekele@mor.gov.et` | JOINT_AUDIT | oromia-tc1 | ACTIVE |
| 306 | `auditor-oromia-tc1-joint-7` | Robel Kebede | `auditor.robel.kebede@mor.gov.et` | JOINT_AUDIT | oromia-tc1 | ACTIVE |
| 307 | `auditor-oromia-tc1-joint-8` | Natnael Mekonnen | `auditor.natnael.mekonnen2@mor.gov.et` | JOINT_AUDIT | oromia-tc1 | ACTIVE |
| 308 | `auditor-oromia-tc1-joint-9` | Yodit Tilahun | `auditor.yodit.tilahun2@mor.gov.et` | JOINT_AUDIT | oromia-tc1 | ACTIVE |
| 309 | `auditor-oromia-tc1-tp-1-1` | Tewodros Mengistu | `auditor.tewodros.mengistu@mor.gov.et` | TRANSFER_PRICING | oromia-tc1 | ACTIVE |
| 310 | `auditor-oromia-tc1-tp-1-2` | Ruth Wakjira | `auditor.ruth.wakjira@mor.gov.et` | TRANSFER_PRICING | oromia-tc1 | ACTIVE |
| 311 | `auditor-oromia-tc1-tp-2-1` | Ruth Gebre | `auditor.ruth.gebre@mor.gov.et` | TRANSFER_PRICING | oromia-tc1 | ACTIVE |
| 312 | `auditor-oromia-tc1-tp-2-2` | Amanuel Lemma | `auditor.amanuel.lemma@mor.gov.et` | TRANSFER_PRICING | oromia-tc1 | ACTIVE |
| 313 | `auditor-oromia-tc2-comp-1-1` | Abebe Tilahun | `auditor.abebe.tilahun@mor.gov.et` | COMPREHENSIVE_AUDIT | oromia-tc2 | ACTIVE |
| 314 | `auditor-oromia-tc2-comp-1-2` | Tsega Mekonnen | `auditor.tsega.mekonnen@mor.gov.et` | COMPREHENSIVE_AUDIT | oromia-tc2 | ACTIVE |
| 315 | `auditor-oromia-tc2-comp-2-1` | Tsega Hassan | `auditor.tsega.hassan@mor.gov.et` | COMPREHENSIVE_AUDIT | oromia-tc2 | ACTIVE |
| 316 | `auditor-oromia-tc2-comp-2-2` | Berihun Mengistu | `auditor.berihun.mengistu@mor.gov.et` | COMPREHENSIVE_AUDIT | oromia-tc2 | ACTIVE |
| 317 | `auditor-oromia-tc2-desk-1-1` | Kassa Tilahun | `auditor.kassa.tilahun@mor.gov.et` | DESK_AUDIT | oromia-tc2 | ACTIVE |
| 318 | `auditor-oromia-tc2-desk-1-2` | Bikila Assefa | `auditor.bikila.assefa@mor.gov.et` | DESK_AUDIT | oromia-tc2 | ACTIVE |
| 319 | `auditor-oromia-tc2-desk-2-1` | Bikila Negash | `auditor.bikila.negash@mor.gov.et` | DESK_AUDIT | oromia-tc2 | ACTIVE |
| 320 | `auditor-oromia-tc2-desk-2-2` | Tekle Zewde | `auditor.tekle.zewde@mor.gov.et` | DESK_AUDIT | oromia-tc2 | ACTIVE |
| 321 | `auditor-oromia-tc2-issue-1-1` | Fatuma Banti | `auditor.fatuma.banti@mor.gov.et` | ISSUE_AUDIT | oromia-tc2 | ACTIVE |
| 322 | `auditor-oromia-tc2-issue-1-2` | Kassahun Wakjira | `auditor.kassahun.wakjira2@mor.gov.et` | ISSUE_AUDIT | oromia-tc2 | ACTIVE |
| 323 | `auditor-oromia-tc2-issue-2-1` | Kassahun Bekele | `auditor.kassahun.bekele2@mor.gov.et` | ISSUE_AUDIT | oromia-tc2 | ACTIVE |
| 324 | `auditor-oromia-tc2-issue-2-2` | Tirhas Kebede | `auditor.tirhas.kebede2@mor.gov.et` | ISSUE_AUDIT | oromia-tc2 | ACTIVE |
| 325 | `auditor-oromia-tc2-joint-1` | Mekdes Negash | `auditor.mekdes.negash@mor.gov.et` | JOINT_AUDIT | oromia-tc2 | ACTIVE |
| 326 | `auditor-oromia-tc2-joint-10` | Ibrahim Belay | `auditor.ibrahim.belay3@mor.gov.et` | JOINT_AUDIT | oromia-tc2 | ACTIVE |
| 327 | `auditor-oromia-tc2-joint-2` | Tirhas Haile | `auditor.tirhas.haile@mor.gov.et` | JOINT_AUDIT | oromia-tc2 | ACTIVE |
| 328 | `auditor-oromia-tc2-joint-3` | Kassahun Worku | `auditor.kassahun.worku@mor.gov.et` | JOINT_AUDIT | oromia-tc2 | ACTIVE |
| 329 | `auditor-oromia-tc2-joint-4` | Fatuma Kassa | `auditor.fatuma.kassa@mor.gov.et` | JOINT_AUDIT | oromia-tc2 | ACTIVE |
| 330 | `auditor-oromia-tc2-joint-5` | Chaltu Mamo | `auditor.chaltu.mamo@mor.gov.et` | JOINT_AUDIT | oromia-tc2 | ACTIVE |
| 331 | `auditor-oromia-tc2-joint-6` | Yonas Tadesse | `auditor.yonas.tadesse2@mor.gov.et` | JOINT_AUDIT | oromia-tc2 | ACTIVE |
| 332 | `auditor-oromia-tc2-joint-7` | Ibrahim Belay | `auditor.ibrahim.belay2@mor.gov.et` | JOINT_AUDIT | oromia-tc2 | ACTIVE |
| 333 | `auditor-oromia-tc2-joint-8` | Gemechu Girma | `auditor.gemechu.girma@mor.gov.et` | JOINT_AUDIT | oromia-tc2 | ACTIVE |
| 334 | `auditor-oromia-tc2-joint-9` | Getnet Assefa | `auditor.getnet.assefa@mor.gov.et` | JOINT_AUDIT | oromia-tc2 | ACTIVE |
| 335 | `auditor-oromia-tc2-tp-1-1` | Getnet Worku | `auditor.getnet.worku@mor.gov.et` | TRANSFER_PRICING | oromia-tc2 | ACTIVE |
| 336 | `auditor-oromia-tc2-tp-1-2` | Solomon Kassa | `auditor.solomon.kassa@mor.gov.et` | TRANSFER_PRICING | oromia-tc2 | ACTIVE |
| 337 | `auditor-oromia-tc2-tp-2-1` | Solomon Kebede | `auditor.solomon.kebede@mor.gov.et` | TRANSFER_PRICING | oromia-tc2 | ACTIVE |
| 338 | `auditor-oromia-tc2-tp-2-2` | Bereket Bekele | `auditor.bereket.bekele@mor.gov.et` | TRANSFER_PRICING | oromia-tc2 | ACTIVE |
| 339 | `auditor-oromia-tc3-comp-1-1` | Seble Mekonnen | `auditor.seble.mekonnen@mor.gov.et` | COMPREHENSIVE_AUDIT | oromia-tc3 | ACTIVE |
| 340 | `auditor-oromia-tc3-comp-1-2` | Henok Kebede | `auditor.henok.kebede@mor.gov.et` | COMPREHENSIVE_AUDIT | oromia-tc3 | ACTIVE |
| 341 | `auditor-oromia-tc3-comp-2-1` | Henok Mengistu | `auditor.henok.mengistu@mor.gov.et` | COMPREHENSIVE_AUDIT | oromia-tc3 | ACTIVE |
| 342 | `auditor-oromia-tc3-comp-2-2` | Genet Wakjira | `auditor.genet.wakjira@mor.gov.et` | COMPREHENSIVE_AUDIT | oromia-tc3 | ACTIVE |
| 343 | `auditor-oromia-tc3-desk-1-1` | Kidist Assefa | `auditor.kidist.assefa@mor.gov.et` | DESK_AUDIT | oromia-tc3 | ACTIVE |
| 344 | `auditor-oromia-tc3-desk-1-2` | Robel Girma | `auditor.robel.girma@mor.gov.et` | DESK_AUDIT | oromia-tc3 | ACTIVE |
| 345 | `auditor-oromia-tc3-desk-2-1` | Robel Zewde | `auditor.robel.zewde@mor.gov.et` | DESK_AUDIT | oromia-tc3 | ACTIVE |
| 346 | `auditor-oromia-tc3-desk-2-2` | Natnael Bikila | `auditor.natnael.bikila@mor.gov.et` | DESK_AUDIT | oromia-tc3 | ACTIVE |
| 347 | `auditor-oromia-tc3-issue-1-1` | Nardos Desta | `auditor.nardos.desta@mor.gov.et` | ISSUE_AUDIT | oromia-tc3 | ACTIVE |
| 348 | `auditor-oromia-tc3-issue-1-2` | Eleni Berhane | `auditor.eleni.berhane@mor.gov.et` | ISSUE_AUDIT | oromia-tc3 | ACTIVE |
| 349 | `auditor-oromia-tc3-issue-2-1` | Eleni Zewde | `auditor.eleni.zewde@mor.gov.et` | ISSUE_AUDIT | oromia-tc3 | ACTIVE |
| 350 | `auditor-oromia-tc3-issue-2-2` | Yosef Negash | `auditor.yosef.negash@mor.gov.et` | ISSUE_AUDIT | oromia-tc3 | ACTIVE |
| 351 | `auditor-oromia-tc3-joint-1` | Tirhas Banti | `auditor.tirhas.banti@mor.gov.et` | JOINT_AUDIT | oromia-tc3 | ACTIVE |
| 352 | `auditor-oromia-tc3-joint-10` | Michael Girma | `auditor.michael.girma2@mor.gov.et` | JOINT_AUDIT | oromia-tc3 | ACTIVE |
| 353 | `auditor-oromia-tc3-joint-2` | Kassahun Alemayehu | `auditor.kassahun.alemayehu@mor.gov.et` | JOINT_AUDIT | oromia-tc3 | ACTIVE |
| 354 | `auditor-oromia-tc3-joint-3` | Fatuma Kifle | `auditor.fatuma.kifle@mor.gov.et` | JOINT_AUDIT | oromia-tc3 | ACTIVE |
| 355 | `auditor-oromia-tc3-joint-4` | Chaltu Desta | `auditor.chaltu.desta@mor.gov.et` | JOINT_AUDIT | oromia-tc3 | ACTIVE |
| 356 | `auditor-oromia-tc3-joint-5` | Yonas Berhane | `auditor.yonas.berhane@mor.gov.et` | JOINT_AUDIT | oromia-tc3 | ACTIVE |
| 357 | `auditor-oromia-tc3-joint-6` | Ibrahim Wolde | `auditor.ibrahim.wolde@mor.gov.et` | JOINT_AUDIT | oromia-tc3 | ACTIVE |
| 358 | `auditor-oromia-tc3-joint-7` | Gemechu Abera | `auditor.gemechu.abera@mor.gov.et` | JOINT_AUDIT | oromia-tc3 | ACTIVE |
| 359 | `auditor-oromia-tc3-joint-8` | Getnet Gebre | `auditor.getnet.gebre@mor.gov.et` | JOINT_AUDIT | oromia-tc3 | ACTIVE |
| 360 | `auditor-oromia-tc3-joint-9` | Solomon Lemma | `auditor.solomon.lemma2@mor.gov.et` | JOINT_AUDIT | oromia-tc3 | ACTIVE |
| 361 | `auditor-oromia-tc3-tp-1-1` | Tekle Kebede | `auditor.tekle.kebede@mor.gov.et` | TRANSFER_PRICING | oromia-tc3 | ACTIVE |
| 362 | `auditor-oromia-tc3-tp-1-2` | Haile Mekonnen | `auditor.haile.mekonnen@mor.gov.et` | TRANSFER_PRICING | oromia-tc3 | ACTIVE |
| 363 | `auditor-oromia-tc3-tp-2-1` | Haile Worku | `auditor.haile.worku@mor.gov.et` | TRANSFER_PRICING | oromia-tc3 | ACTIVE |
| 364 | `auditor-oromia-tc3-tp-2-2` | Dawit Haile | `auditor.dawit.haile@mor.gov.et` | TRANSFER_PRICING | oromia-tc3 | ACTIVE |
| 365 | `auditor-snnpr-tc1-comp-1-1` | Meron Mideksa | `auditor.meron.mideksa2@mor.gov.et` | COMPREHENSIVE_AUDIT | snnpr-tc1 | ACTIVE |
| 366 | `auditor-snnpr-tc1-comp-1-2` | Selam Getachew | `auditor.selam.getachew2@mor.gov.et` | COMPREHENSIVE_AUDIT | snnpr-tc1 | ACTIVE |
| 367 | `auditor-snnpr-tc1-comp-2-1` | Selam Girma | `auditor.selam.girma@mor.gov.et` | COMPREHENSIVE_AUDIT | snnpr-tc1 | ACTIVE |
| 368 | `auditor-snnpr-tc1-comp-2-2` | Bereket Belay | `auditor.bereket.belay@mor.gov.et` | COMPREHENSIVE_AUDIT | snnpr-tc1 | ACTIVE |
| 369 | `auditor-snnpr-tc1-desk-1-1` | Kassahun Mamo | `auditor.kassahun.mamo@mor.gov.et` | DESK_AUDIT | snnpr-tc1 | ACTIVE |
| 370 | `auditor-snnpr-tc1-desk-1-2` | Tirhas Kassa | `auditor.tirhas.kassa2@mor.gov.et` | DESK_AUDIT | snnpr-tc1 | ACTIVE |
| 371 | `auditor-snnpr-tc1-desk-2-1` | Tirhas Lemma | `auditor.tirhas.lemma@mor.gov.et` | DESK_AUDIT | snnpr-tc1 | ACTIVE |
| 372 | `auditor-snnpr-tc1-desk-2-2` | Mekdes Gebre | `auditor.mekdes.gebre@mor.gov.et` | DESK_AUDIT | snnpr-tc1 | ACTIVE |
| 373 | `auditor-snnpr-tc1-issue-1-1` | Kidist Gebre | `auditor.kidist.gebre@mor.gov.et` | ISSUE_AUDIT | snnpr-tc1 | ACTIVE |
| 374 | `auditor-snnpr-tc1-issue-1-2` | Robel Abera | `auditor.robel.abera@mor.gov.et` | ISSUE_AUDIT | snnpr-tc1 | ACTIVE |
| 375 | `auditor-snnpr-tc1-issue-2-1` | Robel Mengistu | `auditor.robel.mengistu@mor.gov.et` | ISSUE_AUDIT | snnpr-tc1 | ACTIVE |
| 376 | `auditor-snnpr-tc1-issue-2-2` | Natnael Hassan | `auditor.natnael.hassan@mor.gov.et` | ISSUE_AUDIT | snnpr-tc1 | ACTIVE |
| 377 | `auditor-snnpr-tc1-joint-1` | Michael Tesfaye | `auditor.michael.tesfaye@mor.gov.et` | JOINT_AUDIT | snnpr-tc1 | ACTIVE |
| 378 | `auditor-snnpr-tc1-joint-10` | Ephrem Kebede | `auditor.ephrem.kebede@mor.gov.et` | JOINT_AUDIT | snnpr-tc1 | ACTIVE |
| 379 | `auditor-snnpr-tc1-joint-2` | Eyerusalem Mulugeta | `auditor.eyerusalem.mulugeta@mor.gov.et` | JOINT_AUDIT | snnpr-tc1 | ACTIVE |
| 380 | `auditor-snnpr-tc1-joint-3` | Abdi Lemma | `auditor.abdi.lemma@mor.gov.et` | JOINT_AUDIT | snnpr-tc1 | ACTIVE |
| 381 | `auditor-snnpr-tc1-joint-4` | Mahlet Gebre | `auditor.mahlet.gebre@mor.gov.et` | JOINT_AUDIT | snnpr-tc1 | ACTIVE |
| 382 | `auditor-snnpr-tc1-joint-5` | Tolera Abera | `auditor.tolera.abera@mor.gov.et` | JOINT_AUDIT | snnpr-tc1 | ACTIVE |
| 383 | `auditor-snnpr-tc1-joint-6` | Diriba Wolde | `auditor.diriba.wolde@mor.gov.et` | JOINT_AUDIT | snnpr-tc1 | ACTIVE |
| 384 | `auditor-snnpr-tc1-joint-7` | Mulugeta Berhane | `auditor.mulugeta.berhane@mor.gov.et` | JOINT_AUDIT | snnpr-tc1 | ACTIVE |
| 385 | `auditor-snnpr-tc1-joint-8` | Rahel Desta | `auditor.rahel.desta@mor.gov.et` | JOINT_AUDIT | snnpr-tc1 | ACTIVE |
| 386 | `auditor-snnpr-tc1-joint-9` | Berihun Kifle | `auditor.berihun.kifle@mor.gov.et` | JOINT_AUDIT | snnpr-tc1 | ACTIVE |
| 387 | `auditor-snnpr-tc1-tp-1-1` | Mulugeta Tilahun | `auditor.mulugeta.tilahun@mor.gov.et` | TRANSFER_PRICING | snnpr-tc1 | ACTIVE |
| 388 | `auditor-snnpr-tc1-tp-1-2` | Rahel Assefa | `auditor.rahel.assefa2@mor.gov.et` | TRANSFER_PRICING | snnpr-tc1 | ACTIVE |
| 389 | `auditor-snnpr-tc1-tp-2-1` | Rahel Negash | `auditor.rahel.negash@mor.gov.et` | TRANSFER_PRICING | snnpr-tc1 | ACTIVE |
| 390 | `auditor-snnpr-tc1-tp-2-2` | Berihun Zewde | `auditor.berihun.zewde2@mor.gov.et` | TRANSFER_PRICING | snnpr-tc1 | ACTIVE |
| 391 | `auditor-snnpr-tc2-comp-1-1` | Solomon Getachew | `auditor.solomon.getachew@mor.gov.et` | COMPREHENSIVE_AUDIT | snnpr-tc2 | ACTIVE |
| 392 | `auditor-snnpr-tc2-comp-1-2` | Bereket Mideksa | `auditor.bereket.mideksa2@mor.gov.et` | COMPREHENSIVE_AUDIT | snnpr-tc2 | ACTIVE |
| 393 | `auditor-snnpr-tc2-comp-2-1` | Bereket Desta | `auditor.bereket.desta@mor.gov.et` | COMPREHENSIVE_AUDIT | snnpr-tc2 | ACTIVE |
| 394 | `auditor-snnpr-tc2-comp-2-2` | Selam Berhane | `auditor.selam.berhane@mor.gov.et` | COMPREHENSIVE_AUDIT | snnpr-tc2 | ACTIVE |
| 395 | `auditor-snnpr-tc2-desk-1-1` | Abdi Kassa | `auditor.abdi.kassa@mor.gov.et` | DESK_AUDIT | snnpr-tc2 | ACTIVE |
| 396 | `auditor-snnpr-tc2-desk-1-2` | Mahlet Worku | `auditor.mahlet.worku@mor.gov.et` | DESK_AUDIT | snnpr-tc2 | ACTIVE |
| 397 | `auditor-snnpr-tc2-desk-2-1` | Mahlet Gebre | `auditor.mahlet.gebre2@mor.gov.et` | DESK_AUDIT | snnpr-tc2 | ACTIVE |
| 398 | `auditor-snnpr-tc2-desk-2-2` | Tolera Abera | `auditor.tolera.abera2@mor.gov.et` | DESK_AUDIT | snnpr-tc2 | ACTIVE |
| 399 | `auditor-snnpr-tc2-issue-1-1` | Yonas Yohannes | `auditor.yonas.yohannes@mor.gov.et` | ISSUE_AUDIT | snnpr-tc2 | ACTIVE |
| 400 | `auditor-snnpr-tc2-issue-1-2` | Ibrahim Hassan | `auditor.ibrahim.hassan@mor.gov.et` | ISSUE_AUDIT | snnpr-tc2 | ACTIVE |
| 401 | `auditor-snnpr-tc2-issue-2-1` | Ibrahim Wolde | `auditor.ibrahim.wolde2@mor.gov.et` | ISSUE_AUDIT | snnpr-tc2 | ACTIVE |
| 402 | `auditor-snnpr-tc2-issue-2-2` | Gemechu Abera | `auditor.gemechu.abera2@mor.gov.et` | ISSUE_AUDIT | snnpr-tc2 | ACTIVE |
| 403 | `auditor-snnpr-tc2-joint-1` | Eyerusalem Mekonnen | `auditor.eyerusalem.mekonnen@mor.gov.et` | JOINT_AUDIT | snnpr-tc2 | ACTIVE |
| 404 | `auditor-snnpr-tc2-joint-10` | Nardos Bekele | `auditor.nardos.bekele@mor.gov.et` | JOINT_AUDIT | snnpr-tc2 | ACTIVE |
| 405 | `auditor-snnpr-tc2-joint-2` | Abdi Tilahun | `auditor.abdi.tilahun@mor.gov.et` | JOINT_AUDIT | snnpr-tc2 | ACTIVE |
| 406 | `auditor-snnpr-tc2-joint-3` | Mahlet Assefa | `auditor.mahlet.assefa@mor.gov.et` | JOINT_AUDIT | snnpr-tc2 | ACTIVE |
| 407 | `auditor-snnpr-tc2-joint-4` | Tolera Girma | `auditor.tolera.girma@mor.gov.et` | JOINT_AUDIT | snnpr-tc2 | ACTIVE |
| 408 | `auditor-snnpr-tc2-joint-5` | Diriba Belay | `auditor.diriba.belay@mor.gov.et` | JOINT_AUDIT | snnpr-tc2 | ACTIVE |
| 409 | `auditor-snnpr-tc2-joint-6` | Mulugeta Tadesse | `auditor.mulugeta.tadesse@mor.gov.et` | JOINT_AUDIT | snnpr-tc2 | ACTIVE |
| 410 | `auditor-snnpr-tc2-joint-7` | Rahel Mamo | `auditor.rahel.mamo@mor.gov.et` | JOINT_AUDIT | snnpr-tc2 | ACTIVE |
| 411 | `auditor-snnpr-tc2-joint-8` | Berihun Kassa | `auditor.berihun.kassa@mor.gov.et` | JOINT_AUDIT | snnpr-tc2 | ACTIVE |
| 412 | `auditor-snnpr-tc2-joint-9` | Tsega Worku | `auditor.tsega.worku@mor.gov.et` | JOINT_AUDIT | snnpr-tc2 | ACTIVE |
| 413 | `auditor-snnpr-tc2-tp-1-1` | Yosef Wakjira | `auditor.yosef.wakjira@mor.gov.et` | TRANSFER_PRICING | snnpr-tc2 | ACTIVE |
| 414 | `auditor-snnpr-tc2-tp-1-2` | Bethlehem Banti | `auditor.bethlehem.banti2@mor.gov.et` | TRANSFER_PRICING | snnpr-tc2 | ACTIVE |
| 415 | `auditor-snnpr-tc2-tp-2-1` | Bethlehem Lemma | `auditor.bethlehem.lemma@mor.gov.et` | TRANSFER_PRICING | snnpr-tc2 | ACTIVE |
| 416 | `auditor-snnpr-tc2-tp-2-2` | Fikadu Mulugeta | `auditor.fikadu.mulugeta2@mor.gov.et` | TRANSFER_PRICING | snnpr-tc2 | ACTIVE |
| 417 | `auditor-snnpr-tc3-comp-1-1` | Mesfin Mideksa | `auditor.mesfin.mideksa@mor.gov.et` | COMPREHENSIVE_AUDIT | snnpr-tc3 | ACTIVE |
| 418 | `auditor-snnpr-tc3-comp-1-2` | Tewodros Yohannes | `auditor.tewodros.yohannes@mor.gov.et` | COMPREHENSIVE_AUDIT | snnpr-tc3 | ACTIVE |
| 419 | `auditor-snnpr-tc3-comp-2-1` | Tewodros Berhane | `auditor.tewodros.berhane@mor.gov.et` | COMPREHENSIVE_AUDIT | snnpr-tc3 | ACTIVE |
| 420 | `auditor-snnpr-tc3-comp-2-2` | Ruth Wolde | `auditor.ruth.wolde@mor.gov.et` | COMPREHENSIVE_AUDIT | snnpr-tc3 | ACTIVE |
| 421 | `auditor-snnpr-tc3-desk-1-1` | Chaltu Worku | `auditor.chaltu.worku@mor.gov.et` | DESK_AUDIT | snnpr-tc3 | ACTIVE |
| 422 | `auditor-snnpr-tc3-desk-1-2` | Fatuma Haile | `auditor.fatuma.haile@mor.gov.et` | DESK_AUDIT | snnpr-tc3 | ACTIVE |
| 423 | `auditor-snnpr-tc3-desk-2-1` | Fatuma Abera | `auditor.fatuma.abera@mor.gov.et` | DESK_AUDIT | snnpr-tc3 | ACTIVE |
| 424 | `auditor-snnpr-tc3-desk-2-2` | Kassahun Wolde | `auditor.kassahun.wolde@mor.gov.et` | DESK_AUDIT | snnpr-tc3 | ACTIVE |
| 425 | `auditor-snnpr-tc3-issue-1-1` | Ibrahim Bikila | `auditor.ibrahim.bikila@mor.gov.et` | ISSUE_AUDIT | snnpr-tc3 | ACTIVE |
| 426 | `auditor-snnpr-tc3-issue-1-2` | Gemechu Zewde | `auditor.gemechu.zewde@mor.gov.et` | ISSUE_AUDIT | snnpr-tc3 | ACTIVE |
| 427 | `auditor-snnpr-tc3-issue-2-1` | Gemechu Girma | `auditor.gemechu.girma2@mor.gov.et` | ISSUE_AUDIT | snnpr-tc3 | ACTIVE |
| 428 | `auditor-snnpr-tc3-issue-2-2` | Getnet Assefa | `auditor.getnet.assefa2@mor.gov.et` | ISSUE_AUDIT | snnpr-tc3 | ACTIVE |
| 429 | `auditor-snnpr-tc3-joint-1` | Hassen Girma | `auditor.hassen.girma@mor.gov.et` | JOINT_AUDIT | snnpr-tc3 | ACTIVE |
| 430 | `auditor-snnpr-tc3-joint-10` | Hassen Alemu | `auditor.hassen.alemu@mor.gov.et` | JOINT_AUDIT | snnpr-tc3 | ACTIVE |
| 431 | `auditor-snnpr-tc3-joint-2` | Abdi Assefa | `auditor.abdi.assefa@mor.gov.et` | JOINT_AUDIT | snnpr-tc3 | ACTIVE |
| 432 | `auditor-snnpr-tc3-joint-3` | Ephrem Tilahun | `auditor.ephrem.tilahun@mor.gov.et` | JOINT_AUDIT | snnpr-tc3 | ACTIVE |
| 433 | `auditor-snnpr-tc3-joint-4` | Tigist Mekonnen | `auditor.tigist.mekonnen@mor.gov.et` | JOINT_AUDIT | snnpr-tc3 | ACTIVE |
| 434 | `auditor-snnpr-tc3-joint-5` | Almaz Kebede | `auditor.almaz.kebede2@mor.gov.et` | JOINT_AUDIT | snnpr-tc3 | ACTIVE |
| 435 | `auditor-snnpr-tc3-joint-6` | Workneh Bekele | `auditor.workneh.bekele2@mor.gov.et` | JOINT_AUDIT | snnpr-tc3 | ACTIVE |
| 436 | `auditor-snnpr-tc3-joint-7` | Tadesse Alemu | `auditor.tadesse.alemu@mor.gov.et` | JOINT_AUDIT | snnpr-tc3 | ACTIVE |
| 437 | `auditor-snnpr-tc3-joint-8` | Almaw Tesfa | `auditor.almaw.tesfa2@mor.gov.et` | JOINT_AUDIT | snnpr-tc3 | ACTIVE |
| 438 | `auditor-snnpr-tc3-joint-9` | Abebe Getachew | `auditor.abebe.getachew@mor.gov.et` | JOINT_AUDIT | snnpr-tc3 | ACTIVE |
| 439 | `auditor-snnpr-tc3-tp-1-1` | Tolera Abera | `auditor.tolera.abera3@mor.gov.et` | TRANSFER_PRICING | snnpr-tc3 | ACTIVE |
| 440 | `auditor-snnpr-tc3-tp-1-2` | Diriba Wolde | `auditor.diriba.wolde2@mor.gov.et` | TRANSFER_PRICING | snnpr-tc3 | ACTIVE |
| 441 | `auditor-snnpr-tc3-tp-2-1` | Diriba Hassan | `auditor.diriba.hassan@mor.gov.et` | TRANSFER_PRICING | snnpr-tc3 | ACTIVE |
| 442 | `auditor-snnpr-tc3-tp-2-2` | Mulugeta Yohannes | `auditor.mulugeta.yohannes@mor.gov.et` | TRANSFER_PRICING | snnpr-tc3 | ACTIVE |
| 443 | `auditor-somali-tc1-comp-1-1` | Mesfin Mamo | `auditor.mesfin.mamo@mor.gov.et` | COMPREHENSIVE_AUDIT | somali-tc1 | ACTIVE |
| 444 | `auditor-somali-tc1-comp-1-2` | Tewodros Tadesse | `auditor.tewodros.tadesse@mor.gov.et` | COMPREHENSIVE_AUDIT | somali-tc1 | ACTIVE |
| 445 | `auditor-somali-tc1-comp-2-1` | Tewodros Alemu | `auditor.tewodros.alemu2@mor.gov.et` | COMPREHENSIVE_AUDIT | somali-tc1 | ACTIVE |
| 446 | `auditor-somali-tc1-comp-2-2` | Ruth Tesfa | `auditor.ruth.tesfa2@mor.gov.et` | COMPREHENSIVE_AUDIT | somali-tc1 | ACTIVE |
| 447 | `auditor-somali-tc1-desk-1-1` | Kidist Mideksa | `auditor.kidist.mideksa@mor.gov.et` | DESK_AUDIT | somali-tc1 | ACTIVE |
| 448 | `auditor-somali-tc1-desk-1-2` | Addis Yohannes | `auditor.addis.yohannes@mor.gov.et` | DESK_AUDIT | somali-tc1 | ACTIVE |
| 449 | `auditor-somali-tc1-desk-2-1` | Addis Berhane | `auditor.addis.berhane@mor.gov.et` | DESK_AUDIT | somali-tc1 | ACTIVE |
| 450 | `auditor-somali-tc1-desk-2-2` | Nardos Wolde | `auditor.nardos.wolde@mor.gov.et` | DESK_AUDIT | somali-tc1 | ACTIVE |
| 451 | `auditor-somali-tc1-issue-1-1` | Ibrahim Gebre | `auditor.ibrahim.gebre@mor.gov.et` | ISSUE_AUDIT | somali-tc1 | ACTIVE |
| 452 | `auditor-somali-tc1-issue-1-2` | Gemechu Lemma | `auditor.gemechu.lemma2@mor.gov.et` | ISSUE_AUDIT | somali-tc1 | ACTIVE |
| 453 | `auditor-somali-tc1-issue-2-1` | Gemechu Kassa | `auditor.gemechu.kassa@mor.gov.et` | ISSUE_AUDIT | somali-tc1 | ACTIVE |
| 454 | `auditor-somali-tc1-issue-2-2` | Getnet Mamo | `auditor.getnet.mamo2@mor.gov.et` | ISSUE_AUDIT | somali-tc1 | ACTIVE |
| 455 | `auditor-somali-tc1-joint-1` | Hassen Tadesse | `auditor.hassen.tadesse@mor.gov.et` | JOINT_AUDIT | somali-tc1 | ACTIVE |
| 456 | `auditor-somali-tc1-joint-10` | Abdi Kebede | `auditor.abdi.kebede@mor.gov.et` | JOINT_AUDIT | somali-tc1 | ACTIVE |
| 457 | `auditor-somali-tc1-joint-2` | Abdi Belay | `auditor.abdi.belay@mor.gov.et` | JOINT_AUDIT | somali-tc1 | ACTIVE |
| 458 | `auditor-somali-tc1-joint-3` | Ephrem Girma | `auditor.ephrem.girma@mor.gov.et` | JOINT_AUDIT | somali-tc1 | ACTIVE |
| 459 | `auditor-somali-tc1-joint-4` | Tigist Assefa | `auditor.tigist.assefa@mor.gov.et` | JOINT_AUDIT | somali-tc1 | ACTIVE |
| 460 | `auditor-somali-tc1-joint-5` | Almaz Tilahun | `auditor.almaz.tilahun@mor.gov.et` | JOINT_AUDIT | somali-tc1 | ACTIVE |
| 461 | `auditor-somali-tc1-joint-6` | Workneh Mekonnen | `auditor.workneh.mekonnen@mor.gov.et` | JOINT_AUDIT | somali-tc1 | ACTIVE |
| 462 | `auditor-somali-tc1-joint-7` | Tadesse Kebede | `auditor.tadesse.kebede@mor.gov.et` | JOINT_AUDIT | somali-tc1 | ACTIVE |
| 463 | `auditor-somali-tc1-joint-8` | Almaw Bekele | `auditor.almaw.bekele@mor.gov.et` | JOINT_AUDIT | somali-tc1 | ACTIVE |
| 464 | `auditor-somali-tc1-joint-9` | Abebe Alemu | `auditor.abebe.alemu@mor.gov.et` | JOINT_AUDIT | somali-tc1 | ACTIVE |
| 465 | `auditor-somali-tc1-tp-1-1` | Ephrem Lemma | `auditor.ephrem.lemma3@mor.gov.et` | TRANSFER_PRICING | somali-tc1 | ACTIVE |
| 466 | `auditor-somali-tc1-tp-1-2` | Tigist Mulugeta | `auditor.tigist.mulugeta@mor.gov.et` | TRANSFER_PRICING | somali-tc1 | ACTIVE |
| 467 | `auditor-somali-tc1-tp-2-1` | Tigist Mamo | `auditor.tigist.mamo@mor.gov.et` | TRANSFER_PRICING | somali-tc1 | ACTIVE |
| 468 | `auditor-somali-tc1-tp-2-2` | Almaz Tadesse | `auditor.almaz.tadesse@mor.gov.et` | TRANSFER_PRICING | somali-tc1 | ACTIVE |
| 469 | `auditor-somali-tc2-comp-1-1` | Gemechu Tadesse | `auditor.gemechu.tadesse@mor.gov.et` | COMPREHENSIVE_AUDIT | somali-tc2 | ACTIVE |
| 470 | `auditor-somali-tc2-comp-1-2` | Getnet Belay | `auditor.getnet.belay@mor.gov.et` | COMPREHENSIVE_AUDIT | somali-tc2 | ACTIVE |
| 471 | `auditor-somali-tc2-comp-2-1` | Getnet Tesfa | `auditor.getnet.tesfa@mor.gov.et` | COMPREHENSIVE_AUDIT | somali-tc2 | ACTIVE |
| 472 | `auditor-somali-tc2-comp-2-2` | Solomon Getachew | `auditor.solomon.getachew2@mor.gov.et` | COMPREHENSIVE_AUDIT | somali-tc2 | ACTIVE |
| 473 | `auditor-somali-tc2-desk-1-1` | Kassa Yohannes | `auditor.kassa.yohannes2@mor.gov.et` | DESK_AUDIT | somali-tc2 | ACTIVE |
| 474 | `auditor-somali-tc2-desk-1-2` | Mamo Hassan | `auditor.mamo.hassan2@mor.gov.et` | DESK_AUDIT | somali-tc2 | ACTIVE |
| 475 | `auditor-somali-tc2-desk-2-1` | Mamo Wolde | `auditor.mamo.wolde@mor.gov.et` | DESK_AUDIT | somali-tc2 | ACTIVE |
| 476 | `auditor-somali-tc2-desk-2-2` | Hassen Abera | `auditor.hassen.abera@mor.gov.et` | DESK_AUDIT | somali-tc2 | ACTIVE |
| 477 | `auditor-somali-tc2-issue-1-1` | Gemechu Tilahun | `auditor.gemechu.tilahun@mor.gov.et` | ISSUE_AUDIT | somali-tc2 | ACTIVE |
| 478 | `auditor-somali-tc2-issue-1-2` | Getnet Mekonnen | `auditor.getnet.mekonnen@mor.gov.et` | ISSUE_AUDIT | somali-tc2 | ACTIVE |
| 479 | `auditor-somali-tc2-issue-2-1` | Getnet Hassan | `auditor.getnet.hassan@mor.gov.et` | ISSUE_AUDIT | somali-tc2 | ACTIVE |
| 480 | `auditor-somali-tc2-issue-2-2` | Solomon Mengistu | `auditor.solomon.mengistu@mor.gov.et` | ISSUE_AUDIT | somali-tc2 | ACTIVE |
| 481 | `auditor-somali-tc2-joint-1` | Mahlet Wakjira | `auditor.mahlet.wakjira@mor.gov.et` | JOINT_AUDIT | somali-tc2 | ACTIVE |
| 482 | `auditor-somali-tc2-joint-10` | Chaltu Mekonnen | `auditor.chaltu.mekonnen@mor.gov.et` | JOINT_AUDIT | somali-tc2 | ACTIVE |
| 483 | `auditor-somali-tc2-joint-2` | Tolera Mengistu | `auditor.tolera.mengistu@mor.gov.et` | JOINT_AUDIT | somali-tc2 | ACTIVE |
| 484 | `auditor-somali-tc2-joint-3` | Diriba Hassan | `auditor.diriba.hassan2@mor.gov.et` | JOINT_AUDIT | somali-tc2 | ACTIVE |
| 485 | `auditor-somali-tc2-joint-4` | Mulugeta Yohannes | `auditor.mulugeta.yohannes2@mor.gov.et` | JOINT_AUDIT | somali-tc2 | ACTIVE |
| 486 | `auditor-somali-tc2-joint-5` | Rahel Mideksa | `auditor.rahel.mideksa@mor.gov.et` | JOINT_AUDIT | somali-tc2 | ACTIVE |
| 487 | `auditor-somali-tc2-joint-6` | Berihun Getachew | `auditor.berihun.getachew@mor.gov.et` | JOINT_AUDIT | somali-tc2 | ACTIVE |
| 488 | `auditor-somali-tc2-joint-7` | Tsega Tesfa | `auditor.tsega.tesfa@mor.gov.et` | JOINT_AUDIT | somali-tc2 | ACTIVE |
| 489 | `auditor-somali-tc2-joint-8` | Abebe Alemu | `auditor.abebe.alemu2@mor.gov.et` | JOINT_AUDIT | somali-tc2 | ACTIVE |
| 490 | `auditor-somali-tc2-joint-9` | Almaw Bekele | `auditor.almaw.bekele2@mor.gov.et` | JOINT_AUDIT | somali-tc2 | ACTIVE |
| 491 | `auditor-somali-tc2-tp-1-1` | Kassahun Hassan | `auditor.kassahun.hassan@mor.gov.et` | TRANSFER_PRICING | somali-tc2 | ACTIVE |
| 492 | `auditor-somali-tc2-tp-1-2` | Tirhas Yohannes | `auditor.tirhas.yohannes@mor.gov.et` | TRANSFER_PRICING | somali-tc2 | ACTIVE |
| 493 | `auditor-somali-tc2-tp-2-1` | Tirhas Tilahun | `auditor.tirhas.tilahun2@mor.gov.et` | TRANSFER_PRICING | somali-tc2 | ACTIVE |
| 494 | `auditor-somali-tc2-tp-2-2` | Mekdes Assefa | `auditor.mekdes.assefa2@mor.gov.et` | TRANSFER_PRICING | somali-tc2 | ACTIVE |
| 495 | `auditor-somali-tc3-comp-1-1` | Saron Belay | `auditor.saron.belay2@mor.gov.et` | COMPREHENSIVE_AUDIT | somali-tc3 | ACTIVE |
| 496 | `auditor-somali-tc3-comp-1-2` | Fikremariam Girma | `auditor.fikremariam.girma2@mor.gov.et` | COMPREHENSIVE_AUDIT | somali-tc3 | ACTIVE |
| 497 | `auditor-somali-tc3-comp-2-1` | Fikremariam Getachew | `auditor.fikremariam.getachew@mor.gov.et` | COMPREHENSIVE_AUDIT | somali-tc3 | ACTIVE |
| 498 | `auditor-somali-tc3-comp-2-2` | Mesfin Mideksa | `auditor.mesfin.mideksa2@mor.gov.et` | COMPREHENSIVE_AUDIT | somali-tc3 | ACTIVE |
| 499 | `auditor-somali-tc3-desk-1-1` | Natnael Hassan | `auditor.natnael.hassan2@mor.gov.et` | DESK_AUDIT | somali-tc3 | ACTIVE |
| 500 | `auditor-somali-tc3-desk-1-2` | Robel Mengistu | `auditor.robel.mengistu2@mor.gov.et` | DESK_AUDIT | somali-tc3 | ACTIVE |
| 501 | `auditor-somali-tc3-desk-2-1` | Robel Abera | `auditor.robel.abera2@mor.gov.et` | DESK_AUDIT | somali-tc3 | ACTIVE |
| 502 | `auditor-somali-tc3-desk-2-2` | Kidist Gebre | `auditor.kidist.gebre2@mor.gov.et` | DESK_AUDIT | somali-tc3 | ACTIVE |
| 503 | `auditor-somali-tc3-issue-1-1` | Samuel Alemayehu | `auditor.samuel.alemayehu@mor.gov.et` | ISSUE_AUDIT | somali-tc3 | ACTIVE |
| 504 | `auditor-somali-tc3-issue-1-2` | Eden Banti | `auditor.eden.banti@mor.gov.et` | ISSUE_AUDIT | somali-tc3 | ACTIVE |
| 505 | `auditor-somali-tc3-issue-2-1` | Eden Alemu | `auditor.eden.alemu2@mor.gov.et` | ISSUE_AUDIT | somali-tc3 | ACTIVE |
| 506 | `auditor-somali-tc3-issue-2-2` | Meseret Bekele | `auditor.meseret.bekele2@mor.gov.et` | ISSUE_AUDIT | somali-tc3 | ACTIVE |
| 507 | `auditor-somali-tc3-joint-1` | Ephrem Tesfaye | `auditor.ephrem.tesfaye@mor.gov.et` | JOINT_AUDIT | somali-tc3 | ACTIVE |
| 508 | `auditor-somali-tc3-joint-10` | Michael Tilahun | `auditor.michael.tilahun2@mor.gov.et` | JOINT_AUDIT | somali-tc3 | ACTIVE |
| 509 | `auditor-somali-tc3-joint-2` | Tigist Bikila | `auditor.tigist.bikila@mor.gov.et` | JOINT_AUDIT | somali-tc3 | ACTIVE |
| 510 | `auditor-somali-tc3-joint-3` | Almaz Zewde | `auditor.almaz.zewde@mor.gov.et` | JOINT_AUDIT | somali-tc3 | ACTIVE |
| 511 | `auditor-somali-tc3-joint-4` | Workneh Negash | `auditor.workneh.negash@mor.gov.et` | JOINT_AUDIT | somali-tc3 | ACTIVE |
| 512 | `auditor-somali-tc3-joint-5` | Tadesse Haile | `auditor.tadesse.haile@mor.gov.et` | JOINT_AUDIT | somali-tc3 | ACTIVE |
| 513 | `auditor-somali-tc3-joint-6` | Almaw Worku | `auditor.almaw.worku@mor.gov.et` | JOINT_AUDIT | somali-tc3 | ACTIVE |
| 514 | `auditor-somali-tc3-joint-7` | Abebe Kassa | `auditor.abebe.kassa2@mor.gov.et` | JOINT_AUDIT | somali-tc3 | ACTIVE |
| 515 | `auditor-somali-tc3-joint-8` | Tsega Mamo | `auditor.tsega.mamo2@mor.gov.et` | JOINT_AUDIT | somali-tc3 | ACTIVE |
| 516 | `auditor-somali-tc3-joint-9` | Berihun Tadesse | `auditor.berihun.tadesse@mor.gov.et` | JOINT_AUDIT | somali-tc3 | ACTIVE |
| 517 | `auditor-somali-tc3-tp-1-1` | Hassen Kebede | `auditor.hassen.kebede@mor.gov.et` | TRANSFER_PRICING | somali-tc3 | ACTIVE |
| 518 | `auditor-somali-tc3-tp-1-2` | Abdi Bekele | `auditor.abdi.bekele@mor.gov.et` | TRANSFER_PRICING | somali-tc3 | ACTIVE |
| 519 | `auditor-somali-tc3-tp-2-1` | Abdi Wakjira | `auditor.abdi.wakjira3@mor.gov.et` | TRANSFER_PRICING | somali-tc3 | ACTIVE |
| 520 | `auditor-somali-tc3-tp-2-2` | Ephrem Banti | `auditor.ephrem.banti@mor.gov.et` | TRANSFER_PRICING | somali-tc3 | ACTIVE |

---

