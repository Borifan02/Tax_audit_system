package mor.itas.seeders;

import mor.itas.persistence.jpa.entity.ap.AuditorEntity;
import mor.itas.persistence.jpa.entity.ap.UserEntity;
import mor.itas.persistence.jpa.repository.ap.AuditorRepository;
import mor.itas.persistence.jpa.repository.ap.UserJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Seeds all standard users and tax-center-specific Joint Audit personnel into t_user and t_auditor.
 * For each of the 18 tax centers:
 *  - 1 Joint Committee Chairperson
 *  - 1 Joint Committee Member
 *  - 1 Joint Team Leader
 *  - 5 Dedicated Joint Auditors with distinct specializations
 */
@Component
@Profile("mock")
@Slf4j
@RequiredArgsConstructor
public class UserDataSeeder implements CommandLineRunner {

    private final UserJpaRepository userJpaRepo;
    private final AuditorRepository auditorRepo;
    private final Set<String> assignedEmails = new HashSet<>();
    private final Set<String> assignedUsernames = new HashSet<>();

    @Override
    public void run(String... args) throws Exception {
        log.info("[UserDataSeeder] Initializing clean state for Joint Audit users across 18 tax centers...");
        assignedEmails.clear();
        assignedUsernames.clear();
        
        auditorRepo.deleteAll();
        userJpaRepo.deleteAll();

        // ════════════════════════════════════════════════════════════════════════════
        // 1. NATIONAL & REGIONAL LEADERSHIP
        // ════════════════════════════════════════════════════════════════════════════
        seedUser("00000000-0000-0000-0001-000000000001", "eden.haile", "eden.haile@mor.gov.et", "Eden Haile", "PLANNING_TEAM", null, "NATIONAL", null);
        seedUser("00000000-0000-0000-0001-000000000002", "samuel.worku", "samuel.worku@mor.gov.et", "Samuel Worku", "PLANNING_TEAM", null, "NATIONAL", null);
        seedUser("00000000-0000-0000-0002-000000000001", "getnet.bekele", "getnet.bekele@mor.gov.et", "Getnet Bekele", "DIRECTOR", null, "NATIONAL", null);
        seedUser("00000000-0000-0000-0003-000000000001", "almaz.berhane", "almaz.berhane@mor.gov.et", "Almaz Berhane", "SENIOR_MANAGEMENT", null, "NATIONAL", null);
        seedUser("00000000-0000-0000-0003-000000000002", "workneh.wolde", "workneh.wolde@mor.gov.et", "Workneh Wolde", "SENIOR_MANAGEMENT", null, "NATIONAL", null);

        // Regional Directors (6)
        seedUser("00000000-0000-0000-0004-000000000001", "getnet.alemu", "getnet.alemu@mor.gov.et", "Getnet Alemu", "REGIONAL_DIRECTOR", null, "REGIONAL", "addis_ababa");
        seedUser("00000000-0000-0000-0004-000000000002", "tadesse.kebede", "tadesse.kebede@mor.gov.et", "Tadesse Kebede", "REGIONAL_DIRECTOR", null, "REGIONAL", "amhara");
        seedUser("00000000-0000-0000-0004-000000000003", "gemechu.negash", "gemechu.negash@mor.gov.et", "Gemechu Negash", "REGIONAL_DIRECTOR", null, "REGIONAL", "oromia");
        seedUser("00000000-0000-0000-0004-000000000004", "kassahun.worku", "kassahun.worku@mor.gov.et", "Kassahun Worku", "REGIONAL_DIRECTOR", null, "REGIONAL", "dire_dawa");
        seedUser("00000000-0000-0000-0004-000000000005", "yonas.mengistu", "yonas.mengistu@mor.gov.et", "Yonas Mengistu", "REGIONAL_DIRECTOR", null, "REGIONAL", "snnpr");
        seedUser("00000000-0000-0000-0004-000000000006", "ibrahim.hassan", "ibrahim.hassan@mor.gov.et", "Ibrahim Hassan", "REGIONAL_DIRECTOR", null, "REGIONAL", "somali");

        // Tax Center Managers (18)
        seedUser("00000000-0000-0000-0005-000000000001", "aa1.manager", "aa1.manager@mor.gov.et", "Manager Addis Ababa TC1", "TAX_CENTER_MANAGER", null, "TAX_CENTER", "addis_ababa-tc1");
        seedUser("00000000-0000-0000-0005-000000000002", "aa2.manager", "aa2.manager@mor.gov.et", "Manager Addis Ababa TC2", "TAX_CENTER_MANAGER", null, "TAX_CENTER", "addis_ababa-tc2");
        seedUser("00000000-0000-0000-0005-000000000003", "aa3.manager", "aa3.manager@mor.gov.et", "Manager Addis Ababa TC3", "TAX_CENTER_MANAGER", null, "TAX_CENTER", "addis_ababa-tc3");
        seedUser("00000000-0000-0000-0005-000000000004", "or1.manager", "or1.manager@mor.gov.et", "Manager Oromia TC1", "TAX_CENTER_MANAGER", null, "TAX_CENTER", "oromia-tc1");
        seedUser("00000000-0000-0000-0005-000000000005", "or2.manager", "or2.manager@mor.gov.et", "Manager Oromia TC2", "TAX_CENTER_MANAGER", null, "TAX_CENTER", "oromia-tc2");
        seedUser("00000000-0000-0000-0005-000000000006", "or3.manager", "or3.manager@mor.gov.et", "Manager Oromia TC3", "TAX_CENTER_MANAGER", null, "TAX_CENTER", "oromia-tc3");
        seedUser("00000000-0000-0000-0005-000000000007", "am1.manager", "am1.manager@mor.gov.et", "Manager Amhara TC1", "TAX_CENTER_MANAGER", null, "TAX_CENTER", "amhara-tc1");
        seedUser("00000000-0000-0000-0005-000000000008", "am2.manager", "am2.manager@mor.gov.et", "Manager Amhara TC2", "TAX_CENTER_MANAGER", null, "TAX_CENTER", "amhara-tc2");
        seedUser("00000000-0000-0000-0005-000000000009", "am3.manager", "am3.manager@mor.gov.et", "Manager Amhara TC3", "TAX_CENTER_MANAGER", null, "TAX_CENTER", "amhara-tc3");
        seedUser("00000000-0000-0000-0005-000000000010", "dd1.manager", "dd1.manager@mor.gov.et", "Manager Dire Dawa TC1", "TAX_CENTER_MANAGER", null, "TAX_CENTER", "dire_dawa-tc1");
        seedUser("00000000-0000-0000-0005-000000000011", "dd2.manager", "dd2.manager@mor.gov.et", "Manager Dire Dawa TC2", "TAX_CENTER_MANAGER", null, "TAX_CENTER", "dire_dawa-tc2");
        seedUser("00000000-0000-0000-0005-000000000012", "dd3.manager", "dd3.manager@mor.gov.et", "Manager Dire Dawa TC3", "TAX_CENTER_MANAGER", null, "TAX_CENTER", "dire_dawa-tc3");
        seedUser("00000000-0000-0000-0005-000000000013", "sn1.manager", "sn1.manager@mor.gov.et", "Manager SNNPR TC1", "TAX_CENTER_MANAGER", null, "TAX_CENTER", "snnpr-tc1");
        seedUser("00000000-0000-0000-0005-000000000014", "sn2.manager", "sn2.manager@mor.gov.et", "Manager SNNPR TC2", "TAX_CENTER_MANAGER", null, "TAX_CENTER", "snnpr-tc2");
        seedUser("00000000-0000-0000-0005-000000000015", "sn3.manager", "sn3.manager@mor.gov.et", "Manager SNNPR TC3", "TAX_CENTER_MANAGER", null, "TAX_CENTER", "snnpr-tc3");
        seedUser("00000000-0000-0000-0005-000000000016", "so1.manager", "so1.manager@mor.gov.et", "Manager Somali TC1", "TAX_CENTER_MANAGER", null, "TAX_CENTER", "somali-tc1");
        seedUser("00000000-0000-0000-0005-000000000017", "so2.manager", "so2.manager@mor.gov.et", "Manager Somali TC2", "TAX_CENTER_MANAGER", null, "TAX_CENTER", "somali-tc2");
        seedUser("00000000-0000-0000-0005-000000000018", "so3.manager", "so3.manager@mor.gov.et", "Manager Somali TC3", "TAX_CENTER_MANAGER", null, "TAX_CENTER", "somali-tc3");
        seedUser("00000000-0000-0000-0005-000000000099", "u-tcm-federal-lto1", "tsega.mulugeta@mor.gov.et", "Tsega Mulugeta", "TAX_CENTER_MANAGER", null, "TAX_CENTER", "federal-lto1");

        // ════════════════════════════════════════════════════════════════════════════
        // 2. JOINT AUDIT PERSONNEL (Federal LTO1 & 18 Regional Tax Centers)
        // ════════════════════════════════════════════════════════════════════════════

        // ── Federal Tax Center (federal-lto1) ──
        seedUser("20000000-0000-0000-0099-000000000001", "fed.ja.chair", "fed.ja.chair@mor.gov.et", "Dr. Solomon Desta", "COMMITTEE_CHAIR", "joint_audit", "TAX_CENTER", "federal-lto1");
        seedUser("20000000-0000-0000-0099-000000000002", "fed.ja.member", "fed.ja.member@mor.gov.et", "Eleni Tesfaye", "COMMITTEE_MEMBER", "joint_audit", "TAX_CENTER", "federal-lto1");
        seedUser("10000000-0000-0000-0099-000000000001", "fed.ja.tl", "fed.ja.tl@mor.gov.et", "Abebe Haile", "TEAM_LEADER", "joint_audit", "TAX_CENTER", "federal-lto1");
        seedUser("10000000-0000-0000-0099-000000000002", "fed.ja.tl2", "fed.ja.tl2@mor.gov.et", "Nardos Negash", "TEAM_LEADER", "joint_audit", "TAX_CENTER", "federal-lto1");
        seedUser("a0000001-0000-0000-0099-000000000001", "fed.ja.auditor1", "fed.ja.auditor1@mor.gov.et", "Fikremariam Tilahun", "AUDITOR", "joint_audit", "TAX_CENTER", "federal-lto1");
        seedAuditor("a0000001-0000-0000-0099-000000000001", "Fikremariam", "Tilahun", "Customs & Tariffs Valuation", "SENIOR", 10, "fed.ja.auditor1@mor.gov.et", "+251-911-990001", "federal-lto1");
        seedUser("a0000001-0000-0000-0099-000000000002", "fed.ja.auditor2", "fed.ja.auditor2@mor.gov.et", "Saron Assefa", "AUDITOR", "joint_audit", "TAX_CENTER", "federal-lto1");
        seedAuditor("a0000001-0000-0000-0099-000000000002", "Saron", "Assefa", "Cross-Border & Transfer Pricing", "PRINCIPAL", 14, "fed.ja.auditor2@mor.gov.et", "+251-911-990002", "federal-lto1");
        seedUser("a0000001-0000-0000-0099-000000000003", "fed.ja.auditor3", "fed.ja.auditor3@mor.gov.et", "Bikila Worku", "AUDITOR", "joint_audit", "TAX_CENTER", "federal-lto1");
        seedAuditor("a0000001-0000-0000-0099-000000000003", "Bikila", "Worku", "Domestic VAT & Sales Reconciliation", "SENIOR", 9, "fed.ja.auditor3@mor.gov.et", "+251-911-990003", "federal-lto1");
        seedUser("a0000001-0000-0000-0099-000000000004", "fed.ja.auditor4", "fed.ja.auditor4@mor.gov.et", "Michael Zewde", "AUDITOR", "joint_audit", "TAX_CENTER", "federal-lto1");
        seedAuditor("a0000001-0000-0000-0099-000000000004", "Michael", "Zewde", "Corporate Income Tax & Deductions", "MID_LEVEL", 6, "fed.ja.auditor4@mor.gov.et", "+251-911-990004", "federal-lto1");
        seedUser("a0000001-0000-0000-0099-000000000005", "fed.ja.auditor5", "fed.ja.auditor5@mor.gov.et", "Saron Negash", "AUDITOR", "joint_audit", "TAX_CENTER", "federal-lto1");
        seedAuditor("a0000001-0000-0000-0099-000000000005", "Saron", "Negash", "Forensic & Investigation", "SENIOR", 11, "fed.ja.auditor5@mor.gov.et", "+251-911-990005", "federal-lto1");
        seedUser("a0000001-0000-0000-0099-000000000006", "fed.ja.auditor6", "fed.ja.auditor6@mor.gov.et", "Almaw Tesfa", "AUDITOR", "joint_audit", "TAX_CENTER", "federal-lto1");
        seedAuditor("a0000001-0000-0000-0099-000000000006", "Almaw", "Tesfa", "Corporate Tax", "MID_LEVEL", 6, "fed.ja.auditor6@mor.gov.et", "+251-911-990006", "federal-lto1");
        seedUser("a0000001-0000-0000-0099-000000000007", "fed.ja.auditor7", "fed.ja.auditor7@mor.gov.et", "Tigist Alemu", "AUDITOR", "joint_audit", "TAX_CENTER", "federal-lto1");
        seedAuditor("a0000001-0000-0000-0099-000000000007", "Tigist", "Alemu", "VAT Compliance", "SENIOR", 8, "fed.ja.auditor7@mor.gov.et", "+251-911-990007", "federal-lto1");
        seedUser("a0000001-0000-0000-0099-000000000008", "fed.ja.auditor8", "fed.ja.auditor8@mor.gov.et", "Ephrem Bekele", "AUDITOR", "joint_audit", "TAX_CENTER", "federal-lto1");
        seedAuditor("a0000001-0000-0000-0099-000000000008", "Ephrem", "Bekele", "International Tax", "MID_LEVEL", 5, "fed.ja.auditor8@mor.gov.et", "+251-911-990008", "federal-lto1");
        seedUser("a0000001-0000-0000-0099-000000000009", "fed.ja.auditor9", "fed.ja.auditor9@mor.gov.et", "Meron Kebede", "AUDITOR", "joint_audit", "TAX_CENTER", "federal-lto1");
        seedAuditor("a0000001-0000-0000-0099-000000000009", "Meron", "Kebede", "Transfer Pricing", "SENIOR", 10, "fed.ja.auditor9@mor.gov.et", "+251-911-990009", "federal-lto1");
        seedUser("a0000001-0000-0000-0099-000000000010", "fed.ja.auditor10", "fed.ja.auditor10@mor.gov.et", "Bereket Mekonnen", "AUDITOR", "joint_audit", "TAX_CENTER", "federal-lto1");
        seedAuditor("a0000001-0000-0000-0099-000000000010", "Bereket", "Mekonnen", "Audit Investigation", "PRINCIPAL", 13, "fed.ja.auditor10@mor.gov.et", "+251-911-990010", "federal-lto1");

        // ── Federal Tax Center 2 (federal-lto2) ──
        seedUser("20000000-0000-0000-0098-000000000001", "fed2.ja.chair", "fed2.ja.chair@mor.gov.et", "Dr. Worku Alemayehu", "COMMITTEE_CHAIR", "joint_audit", "TAX_CENTER", "federal-lto2");
        seedUser("20000000-0000-0000-0098-000000000002", "fed2.ja.member", "fed2.ja.member@mor.gov.et", "Tigist Hailu", "COMMITTEE_MEMBER", "joint_audit", "TAX_CENTER", "federal-lto2");
        seedUser("10000000-0000-0000-0098-000000000001", "fed2.ja.tl", "fed2.ja.tl@mor.gov.et", "Berhanu Bekele", "TEAM_LEADER", "joint_audit", "TAX_CENTER", "federal-lto2");
        seedUser("10000000-0000-0000-0098-000000000002", "fed2.ja.tl2", "fed2.ja.tl2@mor.gov.et", "Eleni Banti", "TEAM_LEADER", "joint_audit", "TAX_CENTER", "federal-lto2");
        seedUser("a0000001-0000-0000-0098-000000000001", "fed2.ja.auditor1", "fed2.ja.auditor1@mor.gov.et", "Dawit Mengistu", "AUDITOR", "joint_audit", "TAX_CENTER", "federal-lto2");
        seedAuditor("a0000001-0000-0000-0098-000000000001", "Dawit", "Mengistu", "Customs & Tariffs Valuation", "SENIOR", 10, "fed2.ja.auditor1@mor.gov.et", "+251-911-980001", "federal-lto2");
        seedUser("a0000001-0000-0000-0098-000000000002", "fed2.ja.auditor2", "fed2.ja.auditor2@mor.gov.et", "Eden Tadesse", "AUDITOR", "joint_audit", "TAX_CENTER", "federal-lto2");
        seedAuditor("a0000001-0000-0000-0098-000000000002", "Eden", "Tadesse", "Cross-Border & Transfer Pricing", "PRINCIPAL", 14, "fed2.ja.auditor2@mor.gov.et", "+251-911-980002", "federal-lto2");
        seedUser("a0000001-0000-0000-0098-000000000003", "fed2.ja.auditor3", "fed2.ja.auditor3@mor.gov.et", "Henok Girma", "AUDITOR", "joint_audit", "TAX_CENTER", "federal-lto2");
        seedAuditor("a0000001-0000-0000-0098-000000000003", "Henok", "Girma", "Domestic VAT & Sales Reconciliation", "SENIOR", 9, "fed2.ja.auditor3@mor.gov.et", "+251-911-980003", "federal-lto2");
        seedUser("a0000001-0000-0000-0098-000000000004", "fed2.ja.auditor4", "fed2.ja.auditor4@mor.gov.et", "Meron Kebede", "AUDITOR", "joint_audit", "TAX_CENTER", "federal-lto2");
        seedAuditor("a0000001-0000-0000-0098-000000000004", "Meron", "Kebede", "Corporate Income Tax & Deductions", "MID_LEVEL", 6, "fed2.ja.auditor4@mor.gov.et", "+251-911-980004", "federal-lto2");
        seedUser("a0000001-0000-0000-0098-000000000005", "fed2.ja.auditor5", "fed2.ja.auditor5@mor.gov.et", "Natnael Assefa", "AUDITOR", "joint_audit", "TAX_CENTER", "federal-lto2");
        seedAuditor("a0000001-0000-0000-0098-000000000005", "Natnael", "Assefa", "Forensic & Investigation", "SENIOR", 11, "fed2.ja.auditor5@mor.gov.et", "+251-911-980005", "federal-lto2");
        seedUser("a0000001-0000-0000-0098-000000000006", "fed2.ja.auditor6", "fed2.ja.auditor6@mor.gov.et", "Fikadu Wolde", "AUDITOR", "joint_audit", "TAX_CENTER", "federal-lto2");
        seedAuditor("a0000001-0000-0000-0098-000000000006", "Fikadu", "Wolde", "Corporate Tax", "SENIOR", 8, "fed2.ja.auditor6@mor.gov.et", "+251-911-980006", "federal-lto2");
        seedUser("a0000001-0000-0000-0098-000000000007", "fed2.ja.auditor7", "fed2.ja.auditor7@mor.gov.et", "Genet Alemu", "AUDITOR", "joint_audit", "TAX_CENTER", "federal-lto2");
        seedAuditor("a0000001-0000-0000-0098-000000000007", "Genet", "Alemu", "VAT Compliance", "SENIOR", 9, "fed2.ja.auditor7@mor.gov.et", "+251-911-980007", "federal-lto2");
        seedUser("a0000001-0000-0000-0098-000000000008", "fed2.ja.auditor8", "fed2.ja.auditor8@mor.gov.et", "Habtamu Desta", "AUDITOR", "joint_audit", "TAX_CENTER", "federal-lto2");
        seedAuditor("a0000001-0000-0000-0098-000000000008", "Habtamu", "Desta", "International Tax", "MID_LEVEL", 6, "fed2.ja.auditor8@mor.gov.et", "+251-911-980008", "federal-lto2");
        seedUser("a0000001-0000-0000-0098-000000000009", "fed2.ja.auditor9", "fed2.ja.auditor9@mor.gov.et", "Selam Haile", "AUDITOR", "joint_audit", "TAX_CENTER", "federal-lto2");
        seedAuditor("a0000001-0000-0000-0098-000000000009", "Selam", "Haile", "Transfer Pricing", "SENIOR", 11, "fed2.ja.auditor9@mor.gov.et", "+251-911-980009", "federal-lto2");
        seedUser("a0000001-0000-0000-0098-000000000010", "fed2.ja.auditor10", "fed2.ja.auditor10@mor.gov.et", "Getnet Alemayehu", "AUDITOR", "joint_audit", "TAX_CENTER", "federal-lto2");
        seedAuditor("a0000001-0000-0000-0098-000000000010", "Getnet", "Alemayehu", "Audit Investigation", "PRINCIPAL", 12, "fed2.ja.auditor10@mor.gov.et", "+251-911-980010", "federal-lto2");

        // ── Addis Ababa TC1 (addis_ababa-tc1) ──
        seedUser("20000000-0000-0000-0001-000000000001", "aa1.chair", "aa1.chair@mor.gov.et", "Dr. Abebe Kebede", "COMMITTEE_CHAIR", "joint_audit", "TAX_CENTER", "addis_ababa-tc1");
        seedUser("20000000-0000-0000-0001-000000000002", "aa1.member", "aa1.member@mor.gov.et", "Fatuma Ahmed", "COMMITTEE_MEMBER", "joint_audit", "TAX_CENTER", "addis_ababa-tc1");
        seedUser("10000000-0000-0000-0001-000000000001", "aa1.tl", "aa1.tl@mor.gov.et", "Dawit Tadesse", "TEAM_LEADER", "joint_audit", "TAX_CENTER", "addis_ababa-tc1");
        seedUser("10000000-0000-0000-0001-000000000002", "aa1.tl2", "aa1.tl2@mor.gov.et", "Robel Girma", "TEAM_LEADER", "joint_audit", "TAX_CENTER", "addis_ababa-tc1");
        seedUser("a0000001-0000-0000-0001-000000000001", "aa1.auditor1", "aa1.auditor1@mor.gov.et", "Sara Mohammed", "AUDITOR", "joint_audit", "TAX_CENTER", "addis_ababa-tc1");
        seedAuditor("a0000001-0000-0000-0001-000000000001", "Sara", "Mohammed", "Customs & Tariffs Valuation", "SENIOR", 10, "aa1.auditor1@mor.gov.et", "+251-911-010001", "addis_ababa-tc1");
        seedUser("a0000001-0000-0000-0001-000000000002", "aa1.auditor2", "aa1.auditor2@mor.gov.et", "Yonas Berhanu", "AUDITOR", "joint_audit", "TAX_CENTER", "addis_ababa-tc1");
        seedAuditor("a0000001-0000-0000-0001-000000000002", "Yonas", "Berhanu", "Cross-Border & Transfer Pricing", "PRINCIPAL", 14, "aa1.auditor2@mor.gov.et", "+251-911-010002", "addis_ababa-tc1");
        seedUser("a0000001-0000-0000-0001-000000000003", "aa1.auditor3", "aa1.auditor3@mor.gov.et", "Hana Girma", "AUDITOR", "joint_audit", "TAX_CENTER", "addis_ababa-tc1");
        seedAuditor("a0000001-0000-0000-0001-000000000003", "Hana", "Girma", "Domestic VAT & Sales Reconciliation", "SENIOR", 9, "aa1.auditor3@mor.gov.et", "+251-911-010003", "addis_ababa-tc1");
        seedUser("a0000001-0000-0000-0001-000000000004", "aa1.auditor4", "aa1.auditor4@mor.gov.et", "Mulugeta Alemayehu", "AUDITOR", "joint_audit", "TAX_CENTER", "addis_ababa-tc1");
        seedAuditor("a0000001-0000-0000-0001-000000000004", "Mulugeta", "Alemayehu", "Corporate Income Tax & Deductions", "MID_LEVEL", 6, "aa1.auditor4@mor.gov.et", "+251-911-010004", "addis_ababa-tc1");
        seedUser("a0000001-0000-0000-0001-000000000005", "aa1.auditor5", "aa1.auditor5@mor.gov.et", "Tigist Haile", "AUDITOR", "joint_audit", "TAX_CENTER", "addis_ababa-tc1");
        seedAuditor("a0000001-0000-0000-0001-000000000005", "Tigist", "Haile", "Forensic & Investigation", "SENIOR", 11, "aa1.auditor5@mor.gov.et", "+251-911-010005", "addis_ababa-tc1");
        seedUser("a0000001-0000-0000-0001-000000000006", "aa1.auditor6", "aa1.auditor6@mor.gov.et", "Chaltu Bekele", "AUDITOR", "joint_audit", "TAX_CENTER", "addis_ababa-tc1");
        seedAuditor("a0000001-0000-0000-0001-000000000006", "Chaltu", "Bekele", "Corporate Tax", "MID_LEVEL", 6, "aa1.auditor6@mor.gov.et", "+251-911-010006", "addis_ababa-tc1");
        seedUser("a0000001-0000-0000-0001-000000000007", "aa1.auditor7", "aa1.auditor7@mor.gov.et", "Diriba Lema", "AUDITOR", "joint_audit", "TAX_CENTER", "addis_ababa-tc1");
        seedAuditor("a0000001-0000-0000-0001-000000000007", "Diriba", "Lema", "VAT Compliance", "SENIOR", 9, "aa1.auditor7@mor.gov.et", "+251-911-010007", "addis_ababa-tc1");
        seedUser("a0000001-0000-0000-0001-000000000008", "aa1.auditor8", "aa1.auditor8@mor.gov.et", "Fikadu Desta", "AUDITOR", "joint_audit", "TAX_CENTER", "addis_ababa-tc1");
        seedAuditor("a0000001-0000-0000-0001-000000000008", "Fikadu", "Desta", "International Tax", "MID_LEVEL", 5, "aa1.auditor8@mor.gov.et", "+251-911-010008", "addis_ababa-tc1");
        seedUser("a0000001-0000-0000-0001-000000000009", "aa1.auditor9", "aa1.auditor9@mor.gov.et", "Gemechu Negash", "AUDITOR", "joint_audit", "TAX_CENTER", "addis_ababa-tc1");
        seedAuditor("a0000001-0000-0000-0001-000000000009", "Gemechu", "Negash", "Transfer Pricing", "SENIOR", 10, "aa1.auditor9@mor.gov.et", "+251-911-010009", "addis_ababa-tc1");
        seedUser("a0000001-0000-0000-0001-000000000010", "aa1.auditor10", "aa1.auditor10@mor.gov.et", "Haile Mengistu", "AUDITOR", "joint_audit", "TAX_CENTER", "addis_ababa-tc1");
        seedAuditor("a0000001-0000-0000-0001-000000000010", "Haile", "Mengistu", "Audit Investigation", "PRINCIPAL", 12, "aa1.auditor10@mor.gov.et", "+251-911-010010", "addis_ababa-tc1");

        // ── Addis Ababa TC2 (addis_ababa-tc2) ──
        seedUser("20000000-0000-0000-0002-000000000001", "aa2.chair", "aa2.chair@mor.gov.et", "Dr. Henok Belay", "COMMITTEE_CHAIR", "joint_audit", "TAX_CENTER", "addis_ababa-tc2");
        seedUser("20000000-0000-0000-0002-000000000002", "aa2.member", "aa2.member@mor.gov.et", "Aster Aweke", "COMMITTEE_MEMBER", "joint_audit", "TAX_CENTER", "addis_ababa-tc2");
        seedUser("10000000-0000-0000-0002-000000000001", "aa2.tl", "aa2.tl@mor.gov.et", "Berhanu Nega", "TEAM_LEADER", "joint_audit", "TAX_CENTER", "addis_ababa-tc2");
        seedUser("a0000001-0000-0000-0002-000000000001", "aa2.auditor1", "aa2.auditor1@mor.gov.et", "Chaltu Bekele", "AUDITOR", "joint_audit", "TAX_CENTER", "addis_ababa-tc2");
        seedAuditor("a0000001-0000-0000-0002-000000000001", "Chaltu", "Bekele", "Customs & Tariffs Valuation", "SENIOR", 10, "aa2.auditor1@mor.gov.et", "+251-911-020001", "addis_ababa-tc2");
        seedUser("a0000001-0000-0000-0002-000000000002", "aa2.auditor2", "aa2.auditor2@mor.gov.et", "Diriba Lema", "AUDITOR", "joint_audit", "TAX_CENTER", "addis_ababa-tc2");
        seedAuditor("a0000001-0000-0000-0002-000000000002", "Diriba", "Lema", "Cross-Border & Transfer Pricing", "PRINCIPAL", 14, "aa2.auditor2@mor.gov.et", "+251-911-020002", "addis_ababa-tc2");
        seedUser("a0000001-0000-0000-0002-000000000003", "aa2.auditor3", "aa2.auditor3@mor.gov.et", "Fikadu Desta", "AUDITOR", "joint_audit", "TAX_CENTER", "addis_ababa-tc2");
        seedAuditor("a0000001-0000-0000-0002-000000000003", "Fikadu", "Desta", "Domestic VAT & Sales Reconciliation", "SENIOR", 9, "aa2.auditor3@mor.gov.et", "+251-911-020003", "addis_ababa-tc2");
        seedUser("a0000001-0000-0000-0002-000000000004", "aa2.auditor4", "aa2.auditor4@mor.gov.et", "Gemechu Negash", "AUDITOR", "joint_audit", "TAX_CENTER", "addis_ababa-tc2");
        seedAuditor("a0000001-0000-0000-0002-000000000004", "Gemechu", "Negash", "Corporate Income Tax & Deductions", "MID_LEVEL", 6, "aa2.auditor4@mor.gov.et", "+251-911-020004", "addis_ababa-tc2");
        seedUser("a0000001-0000-0000-0002-000000000005", "aa2.auditor5", "aa2.auditor5@mor.gov.et", "Haile Mengistu", "AUDITOR", "joint_audit", "TAX_CENTER", "addis_ababa-tc2");
        seedAuditor("a0000001-0000-0000-0002-000000000005", "Haile", "Mengistu", "Forensic & Investigation", "SENIOR", 11, "aa2.auditor5@mor.gov.et", "+251-911-020005", "addis_ababa-tc2");

        // ── Addis Ababa TC3 (addis_ababa-tc3) ──
        seedUser("20000000-0000-0000-0003-000000000001", "aa3.chair", "aa3.chair@mor.gov.et", "Dr. Ibrahim Hassan", "COMMITTEE_CHAIR", "joint_audit", "TAX_CENTER", "addis_ababa-tc3");
        seedUser("20000000-0000-0000-0003-000000000002", "aa3.member", "aa3.member@mor.gov.et", "Jalene Gemeda", "COMMITTEE_MEMBER", "joint_audit", "TAX_CENTER", "addis_ababa-tc3");
        seedUser("10000000-0000-0000-0003-000000000001", "aa3.tl", "aa3.tl@mor.gov.et", "Kedir Kedir", "TEAM_LEADER", "joint_audit", "TAX_CENTER", "addis_ababa-tc3");
        seedUser("a0000001-0000-0000-0003-000000000001", "aa3.auditor1", "aa3.auditor1@mor.gov.et", "Lemlem Tesfaye", "AUDITOR", "joint_audit", "TAX_CENTER", "addis_ababa-tc3");
        seedAuditor("a0000001-0000-0000-0003-000000000001", "Lemlem", "Tesfaye", "Customs & Tariffs Valuation", "SENIOR", 10, "aa3.auditor1@mor.gov.et", "+251-911-030001", "addis_ababa-tc3");
        seedUser("a0000001-0000-0000-0003-000000000002", "aa3.auditor2", "aa3.auditor2@mor.gov.et", "Meron Hailu", "AUDITOR", "joint_audit", "TAX_CENTER", "addis_ababa-tc3");
        seedAuditor("a0000001-0000-0000-0003-000000000002", "Meron", "Hailu", "Cross-Border & Transfer Pricing", "PRINCIPAL", 14, "aa3.auditor2@mor.gov.et", "+251-911-030002", "addis_ababa-tc3");
        seedUser("a0000001-0000-0000-0003-000000000003", "aa3.auditor3", "aa3.auditor3@mor.gov.et", "Nardos Alemu", "AUDITOR", "joint_audit", "TAX_CENTER", "addis_ababa-tc3");
        seedAuditor("a0000001-0000-0000-0003-000000000003", "Nardos", "Alemu", "Domestic VAT & Sales Reconciliation", "SENIOR", 9, "aa3.auditor3@mor.gov.et", "+251-911-030003", "addis_ababa-tc3");
        seedUser("a0000001-0000-0000-0003-000000000004", "aa3.auditor4", "aa3.auditor4@mor.gov.et", "Obsa Banti", "AUDITOR", "joint_audit", "TAX_CENTER", "addis_ababa-tc3");
        seedAuditor("a0000001-0000-0000-0003-000000000004", "Obsa", "Banti", "Corporate Income Tax & Deductions", "MID_LEVEL", 6, "aa3.auditor4@mor.gov.et", "+251-911-030004", "addis_ababa-tc3");
        seedUser("a0000001-0000-0000-0003-000000000005", "aa3.auditor5", "aa3.auditor5@mor.gov.et", "Robel Wolde", "AUDITOR", "joint_audit", "TAX_CENTER", "addis_ababa-tc3");
        seedAuditor("a0000001-0000-0000-0003-000000000005", "Robel", "Wolde", "Forensic & Investigation", "SENIOR", 11, "aa3.auditor5@mor.gov.et", "+251-911-030005", "addis_ababa-tc3");

        // ── Oromia TC1 (oromia-tc1) ──
        seedUser("20000000-0000-0000-0004-000000000001", "or1.chair", "or1.chair@mor.gov.et", "Dr. Selam Tekle", "COMMITTEE_CHAIR", "joint_audit", "TAX_CENTER", "oromia-tc1");
        seedUser("20000000-0000-0000-0004-000000000002", "or1.member", "or1.member@mor.gov.et", "Tadesse Assefa", "COMMITTEE_MEMBER", "joint_audit", "TAX_CENTER", "oromia-tc1");
        seedUser("10000000-0000-0000-0004-000000000001", "or1.tl", "or1.tl@mor.gov.et", "Urga Wakjira", "TEAM_LEADER", "joint_audit", "TAX_CENTER", "oromia-tc1");
        seedUser("a0000001-0000-0000-0004-000000000001", "or1.auditor1", "or1.auditor1@mor.gov.et", "Wondwossen Worku", "AUDITOR", "joint_audit", "TAX_CENTER", "oromia-tc1");
        seedAuditor("a0000001-0000-0000-0004-000000000001", "Wondwossen", "Worku", "Customs & Tariffs Valuation", "SENIOR", 10, "or1.auditor1@mor.gov.et", "+251-911-040001", "oromia-tc1");
        seedUser("a0000001-0000-0000-0004-000000000002", "or1.auditor2", "or1.auditor2@mor.gov.et", "Yared Kifle", "AUDITOR", "joint_audit", "TAX_CENTER", "oromia-tc1");
        seedAuditor("a0000001-0000-0000-0004-000000000002", "Yared", "Kifle", "Cross-Border & Transfer Pricing", "PRINCIPAL", 14, "or1.auditor2@mor.gov.et", "+251-911-040002", "oromia-tc1");
        seedUser("a0000001-0000-0000-0004-000000000003", "or1.auditor3", "or1.auditor3@mor.gov.et", "Zinash Zewde", "AUDITOR", "joint_audit", "TAX_CENTER", "oromia-tc1");
        seedAuditor("a0000001-0000-0000-0004-000000000003", "Zinash", "Zewde", "Domestic VAT & Sales Reconciliation", "SENIOR", 9, "or1.auditor3@mor.gov.et", "+251-911-040003", "oromia-tc1");
        seedUser("a0000001-0000-0000-0004-000000000004", "or1.auditor4", "or1.auditor4@mor.gov.et", "Almaz Solomon", "AUDITOR", "joint_audit", "TAX_CENTER", "oromia-tc1");
        seedAuditor("a0000001-0000-0000-0004-000000000004", "Almaz", "Solomon", "Corporate Income Tax & Deductions", "MID_LEVEL", 6, "or1.auditor4@mor.gov.et", "+251-911-040004", "oromia-tc1");
        seedUser("a0000001-0000-0000-0004-000000000005", "or1.auditor5", "or1.auditor5@mor.gov.et", "Biruk Melaku", "AUDITOR", "joint_audit", "TAX_CENTER", "oromia-tc1");
        seedAuditor("a0000001-0000-0000-0004-000000000005", "Biruk", "Melaku", "Forensic & Investigation", "SENIOR", 11, "or1.auditor5@mor.gov.et", "+251-911-040005", "oromia-tc1");

        // ── Oromia TC2 (oromia-tc2) ──
        seedUser("20000000-0000-0000-0005-000000000001", "or2.chair", "or2.chair@mor.gov.et", "Dr. Dereje Getnet", "COMMITTEE_CHAIR", "joint_audit", "TAX_CENTER", "oromia-tc2");
        seedUser("20000000-0000-0000-0005-000000000002", "or2.member", "or2.member@mor.gov.et", "Eden Demissie", "COMMITTEE_MEMBER", "joint_audit", "TAX_CENTER", "oromia-tc2");
        seedUser("10000000-0000-0000-0005-000000000001", "or2.tl", "or2.tl@mor.gov.et", "Fitsum Fanta", "TEAM_LEADER", "joint_audit", "TAX_CENTER", "oromia-tc2");
        seedUser("a0000001-0000-0000-0005-000000000001", "or2.auditor1", "or2.auditor1@mor.gov.et", "Getnet Tefera", "AUDITOR", "joint_audit", "TAX_CENTER", "oromia-tc2");
        seedAuditor("a0000001-0000-0000-0005-000000000001", "Getnet", "Tefera", "Customs & Tariffs Valuation", "SENIOR", 10, "or2.auditor1@mor.gov.et", "+251-911-050001", "oromia-tc2");
        seedUser("a0000001-0000-0000-0005-000000000002", "or2.auditor2", "or2.auditor2@mor.gov.et", "Hirut Mekonnen", "AUDITOR", "joint_audit", "TAX_CENTER", "oromia-tc2");
        seedAuditor("a0000001-0000-0000-0005-000000000002", "Hirut", "Mekonnen", "Cross-Border & Transfer Pricing", "PRINCIPAL", 14, "or2.auditor2@mor.gov.et", "+251-911-050002", "oromia-tc2");
        seedUser("a0000001-0000-0000-0005-000000000003", "or2.auditor3", "or2.auditor3@mor.gov.et", "Iyasu Abera", "AUDITOR", "joint_audit", "TAX_CENTER", "oromia-tc2");
        seedAuditor("a0000001-0000-0000-0005-000000000003", "Iyasu", "Abera", "Domestic VAT & Sales Reconciliation", "SENIOR", 9, "or2.auditor3@mor.gov.et", "+251-911-050003", "oromia-tc2");
        seedUser("a0000001-0000-0000-0005-000000000004", "or2.auditor4", "or2.auditor4@mor.gov.et", "Kalkidan Ayalew", "AUDITOR", "joint_audit", "TAX_CENTER", "oromia-tc2");
        seedAuditor("a0000001-0000-0000-0005-000000000004", "Kalkidan", "Ayalew", "Corporate Income Tax & Deductions", "MID_LEVEL", 6, "or2.auditor4@mor.gov.et", "+251-911-050004", "oromia-tc2");
        seedUser("a0000001-0000-0000-0005-000000000005", "or2.auditor5", "or2.auditor5@mor.gov.et", "Lulit Regassa", "AUDITOR", "joint_audit", "TAX_CENTER", "oromia-tc2");
        seedAuditor("a0000001-0000-0000-0005-000000000005", "Lulit", "Regassa", "Forensic & Investigation", "SENIOR", 11, "or2.auditor5@mor.gov.et", "+251-911-050005", "oromia-tc2");

        // ── Oromia TC3 (oromia-tc3) ──
        seedUser("20000000-0000-0000-0006-000000000001", "or3.chair", "or3.chair@mor.gov.et", "Dr. Mekdes Geda", "COMMITTEE_CHAIR", "joint_audit", "TAX_CENTER", "oromia-tc3");
        seedUser("20000000-0000-0000-0006-000000000002", "or3.member", "or3.member@mor.gov.et", "Natnael Tolossa", "COMMITTEE_MEMBER", "joint_audit", "TAX_CENTER", "oromia-tc3");
        seedUser("10000000-0000-0000-0006-000000000001", "or3.tl", "or3.tl@mor.gov.et", "Rahel Bacha", "TEAM_LEADER", "joint_audit", "TAX_CENTER", "oromia-tc3");
        seedUser("a0000001-0000-0000-0006-000000000001", "or3.auditor1", "or3.auditor1@mor.gov.et", "Samuel Dejene", "AUDITOR", "joint_audit", "TAX_CENTER", "oromia-tc3");
        seedAuditor("a0000001-0000-0000-0006-000000000001", "Samuel", "Dejene", "Customs & Tariffs Valuation", "SENIOR", 10, "or3.auditor1@mor.gov.et", "+251-911-060001", "oromia-tc3");
        seedUser("a0000001-0000-0000-0006-000000000002", "or3.auditor2", "or3.auditor2@mor.gov.et", "Tariku Shiferaw", "AUDITOR", "joint_audit", "TAX_CENTER", "oromia-tc3");
        seedAuditor("a0000001-0000-0000-0006-000000000002", "Tariku", "Shiferaw", "Cross-Border & Transfer Pricing", "PRINCIPAL", 14, "or3.auditor2@mor.gov.et", "+251-911-060002", "oromia-tc3");
        seedUser("a0000001-0000-0000-0006-000000000003", "or3.auditor3", "or3.auditor3@mor.gov.et", "Worku Zenebe", "AUDITOR", "joint_audit", "TAX_CENTER", "oromia-tc3");
        seedAuditor("a0000001-0000-0000-0006-000000000003", "Worku", "Zenebe", "Domestic VAT & Sales Reconciliation", "SENIOR", 9, "or3.auditor3@mor.gov.et", "+251-911-060003", "oromia-tc3");
        seedUser("a0000001-0000-0000-0006-000000000004", "or3.auditor4", "or3.auditor4@mor.gov.et", "Yohannes Bogale", "AUDITOR", "joint_audit", "TAX_CENTER", "oromia-tc3");
        seedAuditor("a0000001-0000-0000-0006-000000000004", "Yohannes", "Bogale", "Corporate Income Tax & Deductions", "MID_LEVEL", 6, "or3.auditor4@mor.gov.et", "+251-911-060004", "oromia-tc3");
        seedUser("a0000001-0000-0000-0006-000000000005", "or3.auditor5", "or3.auditor5@mor.gov.et", "Zewdu Amare", "AUDITOR", "joint_audit", "TAX_CENTER", "oromia-tc3");
        seedAuditor("a0000001-0000-0000-0006-000000000005", "Zewdu", "Amare", "Forensic & Investigation", "SENIOR", 11, "or3.auditor5@mor.gov.et", "+251-911-060005", "oromia-tc3");

        // ── Amhara TC1 (amhara-tc1) ──
        seedUser("20000000-0000-0000-0007-000000000001", "am1.chair", "am1.chair@mor.gov.et", "Dr. Ashenafi Baye", "COMMITTEE_CHAIR", "joint_audit", "TAX_CENTER", "amhara-tc1");
        seedUser("20000000-0000-0000-0007-000000000002", "am1.member", "am1.member@mor.gov.et", "Bethlehem Gebre", "COMMITTEE_MEMBER", "joint_audit", "TAX_CENTER", "amhara-tc1");
        seedUser("10000000-0000-0000-0007-000000000001", "am1.tl", "am1.tl@mor.gov.et", "Daniel Habte", "TEAM_LEADER", "joint_audit", "TAX_CENTER", "amhara-tc1");
        seedUser("a0000001-0000-0000-0007-000000000001", "am1.auditor1", "am1.auditor1@mor.gov.et", "Eyerusalem Jembere", "AUDITOR", "joint_audit", "TAX_CENTER", "amhara-tc1");
        seedAuditor("a0000001-0000-0000-0007-000000000001", "Eyerusalem", "Jembere", "Customs & Tariffs Valuation", "SENIOR", 10, "am1.auditor1@mor.gov.et", "+251-911-070001", "amhara-tc1");
        seedUser("a0000001-0000-0000-0007-000000000002", "am1.auditor2", "am1.auditor2@mor.gov.et", "Fasika Kassaye", "AUDITOR", "joint_audit", "TAX_CENTER", "amhara-tc1");
        seedAuditor("a0000001-0000-0000-0007-000000000002", "Fasika", "Kassaye", "Cross-Border & Transfer Pricing", "PRINCIPAL", 14, "am1.auditor2@mor.gov.et", "+251-911-070002", "amhara-tc1");
        seedUser("a0000001-0000-0000-0007-000000000003", "am1.auditor3", "am1.auditor3@mor.gov.et", "Girma Legesse", "AUDITOR", "joint_audit", "TAX_CENTER", "amhara-tc1");
        seedAuditor("a0000001-0000-0000-0007-000000000003", "Girma", "Legesse", "Domestic VAT & Sales Reconciliation", "SENIOR", 9, "am1.auditor3@mor.gov.et", "+251-911-070003", "amhara-tc1");
        seedUser("a0000001-0000-0000-0007-000000000004", "am1.auditor4", "am1.auditor4@mor.gov.et", "Habtamu Mamo", "AUDITOR", "joint_audit", "TAX_CENTER", "amhara-tc1");
        seedAuditor("a0000001-0000-0000-0007-000000000004", "Habtamu", "Mamo", "Corporate Income Tax & Deductions", "MID_LEVEL", 6, "am1.auditor4@mor.gov.et", "+251-911-070004", "amhara-tc1");
        seedUser("a0000001-0000-0000-0007-000000000005", "am1.auditor5", "am1.auditor5@mor.gov.et", "Kassahun Negussie", "AUDITOR", "joint_audit", "TAX_CENTER", "amhara-tc1");
        seedAuditor("a0000001-0000-0000-0007-000000000005", "Kassahun", "Negussie", "Forensic & Investigation", "SENIOR", 11, "am1.auditor5@mor.gov.et", "+251-911-070005", "amhara-tc1");

        // ── Amhara TC2 (amhara-tc2) ──
        seedUser("20000000-0000-0000-0008-000000000001", "am2.chair", "am2.chair@mor.gov.et", "Dr. Meseret Oumer", "COMMITTEE_CHAIR", "joint_audit", "TAX_CENTER", "amhara-tc2");
        seedUser("20000000-0000-0000-0008-000000000002", "am2.member", "am2.member@mor.gov.et", "Nebiyu Reda", "COMMITTEE_MEMBER", "joint_audit", "TAX_CENTER", "amhara-tc2");
        seedUser("10000000-0000-0000-0008-000000000001", "am2.tl", "am2.tl@mor.gov.et", "Rediet Seyoum", "TEAM_LEADER", "joint_audit", "TAX_CENTER", "amhara-tc2");
        seedUser("a0000001-0000-0000-0008-000000000001", "am2.auditor1", "am2.auditor1@mor.gov.et", "Samson Tilahun", "AUDITOR", "joint_audit", "TAX_CENTER", "amhara-tc2");
        seedAuditor("a0000001-0000-0000-0008-000000000001", "Samson", "Tilahun", "Customs & Tariffs Valuation", "SENIOR", 10, "am2.auditor1@mor.gov.et", "+251-911-080001", "amhara-tc2");
        seedUser("a0000001-0000-0000-0008-000000000002", "am2.auditor2", "am2.auditor2@mor.gov.et", "Tesfaye Wondimu", "AUDITOR", "joint_audit", "TAX_CENTER", "amhara-tc2");
        seedAuditor("a0000001-0000-0000-0008-000000000002", "Tesfaye", "Wondimu", "Cross-Border & Transfer Pricing", "PRINCIPAL", 14, "am2.auditor2@mor.gov.et", "+251-911-080002", "amhara-tc2");
        seedUser("a0000001-0000-0000-0008-000000000003", "am2.auditor3", "am2.auditor3@mor.gov.et", "Walelign Yilma", "AUDITOR", "joint_audit", "TAX_CENTER", "amhara-tc2");
        seedAuditor("a0000001-0000-0000-0008-000000000003", "Walelign", "Yilma", "Domestic VAT & Sales Reconciliation", "SENIOR", 9, "am2.auditor3@mor.gov.et", "+251-911-080003", "amhara-tc2");
        seedUser("a0000001-0000-0000-0008-000000000004", "am2.auditor4", "am2.auditor4@mor.gov.et", "Yeshi Zerihun", "AUDITOR", "joint_audit", "TAX_CENTER", "amhara-tc2");
        seedAuditor("a0000001-0000-0000-0008-000000000004", "Yeshi", "Zerihun", "Corporate Income Tax & Deductions", "MID_LEVEL", 6, "am2.auditor4@mor.gov.et", "+251-911-080004", "amhara-tc2");
        seedUser("a0000001-0000-0000-0008-000000000005", "am2.auditor5", "am2.auditor5@mor.gov.et", "Zeberga Abate", "AUDITOR", "joint_audit", "TAX_CENTER", "amhara-tc2");
        seedAuditor("a0000001-0000-0000-0008-000000000005", "Zeberga", "Abate", "Forensic & Investigation", "SENIOR", 11, "am2.auditor5@mor.gov.et", "+251-911-080005", "amhara-tc2");

        // ── Amhara TC3 (amhara-tc3) ──
        seedUser("20000000-0000-0000-0009-000000000001", "am3.chair", "am3.chair@mor.gov.et", "Dr. Abdi Balcha", "COMMITTEE_CHAIR", "joint_audit", "TAX_CENTER", "amhara-tc3");
        seedUser("20000000-0000-0000-0009-000000000002", "am3.member", "am3.member@mor.gov.et", "Birtukan Chernet", "COMMITTEE_MEMBER", "joint_audit", "TAX_CENTER", "amhara-tc3");
        seedUser("10000000-0000-0000-0009-000000000001", "am3.tl", "am3.tl@mor.gov.et", "Dejene Dinkayehu", "TEAM_LEADER", "joint_audit", "TAX_CENTER", "amhara-tc3");
        seedUser("a0000001-0000-0000-0009-000000000001", "am3.auditor1", "am3.auditor1@mor.gov.et", "Elsabeth Eshete", "AUDITOR", "joint_audit", "TAX_CENTER", "amhara-tc3");
        seedAuditor("a0000001-0000-0000-0009-000000000001", "Elsabeth", "Eshete", "Customs & Tariffs Valuation", "SENIOR", 10, "am3.auditor1@mor.gov.et", "+251-911-090001", "amhara-tc3");
        seedUser("a0000001-0000-0000-0009-000000000002", "am3.auditor2", "am3.auditor2@mor.gov.et", "Fasil Fikre", "AUDITOR", "joint_audit", "TAX_CENTER", "amhara-tc3");
        seedAuditor("a0000001-0000-0000-0009-000000000002", "Fasil", "Fikre", "Cross-Border & Transfer Pricing", "PRINCIPAL", 14, "am3.auditor2@mor.gov.et", "+251-911-090002", "amhara-tc3");
        seedUser("a0000001-0000-0000-0009-000000000003", "am3.auditor3", "am3.auditor3@mor.gov.et", "Genet Gudina", "AUDITOR", "joint_audit", "TAX_CENTER", "amhara-tc3");
        seedAuditor("a0000001-0000-0000-0009-000000000003", "Genet", "Gudina", "Domestic VAT & Sales Reconciliation", "SENIOR", 9, "am3.auditor3@mor.gov.et", "+251-911-090003", "amhara-tc3");
        seedUser("a0000001-0000-0000-0009-000000000004", "am3.auditor4", "am3.auditor4@mor.gov.et", "Hiwot Hunde", "AUDITOR", "joint_audit", "TAX_CENTER", "amhara-tc3");
        seedAuditor("a0000001-0000-0000-0009-000000000004", "Hiwot", "Hunde", "Corporate Income Tax & Deductions", "MID_LEVEL", 6, "am3.auditor4@mor.gov.et", "+251-911-090004", "amhara-tc3");
        seedUser("a0000001-0000-0000-0009-000000000005", "am3.auditor5", "am3.auditor5@mor.gov.et", "Jemal Jima", "AUDITOR", "joint_audit", "TAX_CENTER", "amhara-tc3");
        seedAuditor("a0000001-0000-0000-0009-000000000005", "Jemal", "Jima", "Forensic & Investigation", "SENIOR", 11, "am3.auditor5@mor.gov.et", "+251-911-090005", "amhara-tc3");

        // ── Dire Dawa TC1 (dire_dawa-tc1) ──
        seedUser("20000000-0000-0000-0010-000000000001", "dd1.chair", "dd1.chair@mor.gov.et", "Dr. Kaleb Kassa", "COMMITTEE_CHAIR", "joint_audit", "TAX_CENTER", "dire_dawa-tc1");
        seedUser("20000000-0000-0000-0010-000000000002", "dd1.member", "dd1.member@mor.gov.et", "Martha Lemma", "COMMITTEE_MEMBER", "joint_audit", "TAX_CENTER", "dire_dawa-tc1");
        seedUser("10000000-0000-0000-0010-000000000001", "dd1.tl", "dd1.tl@mor.gov.et", "Netsanet Molla", "TEAM_LEADER", "joint_audit", "TAX_CENTER", "dire_dawa-tc1");
        seedUser("a0000001-0000-0000-0010-000000000001", "dd1.auditor1", "dd1.auditor1@mor.gov.et", "Roman Nida", "AUDITOR", "joint_audit", "TAX_CENTER", "dire_dawa-tc1");
        seedAuditor("a0000001-0000-0000-0010-000000000001", "Roman", "Nida", "Customs & Tariffs Valuation", "SENIOR", 10, "dd1.auditor1@mor.gov.et", "+251-911-100001", "dire_dawa-tc1");
        seedUser("a0000001-0000-0000-0010-000000000002", "dd1.auditor2", "dd1.auditor2@mor.gov.et", "Senait Olana", "AUDITOR", "joint_audit", "TAX_CENTER", "dire_dawa-tc1");
        seedAuditor("a0000001-0000-0000-0010-000000000002", "Senait", "Olana", "Cross-Border & Transfer Pricing", "PRINCIPAL", 14, "dd1.auditor2@mor.gov.et", "+251-911-100002", "dire_dawa-tc1");
        seedUser("a0000001-0000-0000-0010-000000000003", "dd1.auditor3", "dd1.auditor3@mor.gov.et", "Tolera Roba", "AUDITOR", "joint_audit", "TAX_CENTER", "dire_dawa-tc1");
        seedAuditor("a0000001-0000-0000-0010-000000000003", "Tolera", "Roba", "Domestic VAT & Sales Reconciliation", "SENIOR", 9, "dd1.auditor3@mor.gov.et", "+251-911-100003", "dire_dawa-tc1");
        seedUser("a0000001-0000-0000-0010-000000000004", "dd1.auditor4", "dd1.auditor4@mor.gov.et", "Winta Sori", "AUDITOR", "joint_audit", "TAX_CENTER", "dire_dawa-tc1");
        seedAuditor("a0000001-0000-0000-0010-000000000004", "Winta", "Sori", "Corporate Income Tax & Deductions", "MID_LEVEL", 6, "dd1.auditor4@mor.gov.et", "+251-911-100004", "dire_dawa-tc1");
        seedUser("a0000001-0000-0000-0010-000000000005", "dd1.auditor5", "dd1.auditor5@mor.gov.et", "Yidnekachew Tufa", "AUDITOR", "joint_audit", "TAX_CENTER", "dire_dawa-tc1");
        seedAuditor("a0000001-0000-0000-0010-000000000005", "Yidnekachew", "Tufa", "Forensic & Investigation", "SENIOR", 11, "dd1.auditor5@mor.gov.et", "+251-911-100005", "dire_dawa-tc1");

        // ── Dire Dawa TC2 (dire_dawa-tc2) ──
        seedUser("20000000-0000-0000-0011-000000000001", "dd2.chair", "dd2.chair@mor.gov.et", "Dr. Zeineb Urgessa", "COMMITTEE_CHAIR", "joint_audit", "TAX_CENTER", "dire_dawa-tc2");
        seedUser("20000000-0000-0000-0011-000000000002", "dd2.member", "dd2.member@mor.gov.et", "Adane Wami", "COMMITTEE_MEMBER", "joint_audit", "TAX_CENTER", "dire_dawa-tc2");
        seedUser("10000000-0000-0000-0011-000000000001", "dd2.tl", "dd2.tl@mor.gov.et", "Bizuayehu Yadeta", "TEAM_LEADER", "joint_audit", "TAX_CENTER", "dire_dawa-tc2");
        seedUser("a0000001-0000-0000-0011-000000000001", "dd2.auditor1", "dd2.auditor1@mor.gov.et", "Desta Zewdie", "AUDITOR", "joint_audit", "TAX_CENTER", "dire_dawa-tc2");
        seedAuditor("a0000001-0000-0000-0011-000000000001", "Desta", "Zewdie", "Customs & Tariffs Valuation", "SENIOR", 10, "dd2.auditor1@mor.gov.et", "+251-911-110001", "dire_dawa-tc2");
        seedUser("a0000001-0000-0000-0011-000000000002", "dd2.auditor2", "dd2.auditor2@mor.gov.et", "Ephrem Addisu", "AUDITOR", "joint_audit", "TAX_CENTER", "dire_dawa-tc2");
        seedAuditor("a0000001-0000-0000-0011-000000000002", "Ephrem", "Addisu", "Cross-Border & Transfer Pricing", "PRINCIPAL", 14, "dd2.auditor2@mor.gov.et", "+251-911-110002", "dire_dawa-tc2");
        seedUser("a0000001-0000-0000-0011-000000000003", "dd2.auditor3", "dd2.auditor3@mor.gov.et", "Feven Bedada", "AUDITOR", "joint_audit", "TAX_CENTER", "dire_dawa-tc2");
        seedAuditor("a0000001-0000-0000-0011-000000000003", "Feven", "Bedada", "Domestic VAT & Sales Reconciliation", "SENIOR", 9, "dd2.auditor3@mor.gov.et", "+251-911-110003", "dire_dawa-tc2");
        seedUser("a0000001-0000-0000-0011-000000000004", "dd2.auditor4", "dd2.auditor4@mor.gov.et", "Gashaw Chala", "AUDITOR", "joint_audit", "TAX_CENTER", "dire_dawa-tc2");
        seedAuditor("a0000001-0000-0000-0011-000000000004", "Gashaw", "Chala", "Corporate Income Tax & Deductions", "MID_LEVEL", 6, "dd2.auditor4@mor.gov.et", "+251-911-110004", "dire_dawa-tc2");
        seedUser("a0000001-0000-0000-0011-000000000005", "dd2.auditor5", "dd2.auditor5@mor.gov.et", "Helen Defar", "AUDITOR", "joint_audit", "TAX_CENTER", "dire_dawa-tc2");
        seedAuditor("a0000001-0000-0000-0011-000000000005", "Helen", "Defar", "Forensic & Investigation", "SENIOR", 11, "dd2.auditor5@mor.gov.et", "+251-911-110005", "dire_dawa-tc2");

        // ── Dire Dawa TC3 (dire_dawa-tc3) ──
        seedUser("20000000-0000-0000-0012-000000000001", "dd3.chair", "dd3.chair@mor.gov.et", "Dr. Kibret Ergicho", "COMMITTEE_CHAIR", "joint_audit", "TAX_CENTER", "dire_dawa-tc3");
        seedUser("20000000-0000-0000-0012-000000000002", "dd3.member", "dd3.member@mor.gov.et", "Mahlet Feyisa", "COMMITTEE_MEMBER", "joint_audit", "TAX_CENTER", "dire_dawa-tc3");
        seedUser("10000000-0000-0000-0012-000000000001", "dd3.tl", "dd3.tl@mor.gov.et", "Nigist Guta", "TEAM_LEADER", "joint_audit", "TAX_CENTER", "dire_dawa-tc3");
        seedUser("a0000001-0000-0000-0012-000000000001", "dd3.auditor1", "dd3.auditor1@mor.gov.et", "Ruth Hiko", "AUDITOR", "joint_audit", "TAX_CENTER", "dire_dawa-tc3");
        seedAuditor("a0000001-0000-0000-0012-000000000001", "Ruth", "Hiko", "Customs & Tariffs Valuation", "SENIOR", 10, "dd3.auditor1@mor.gov.et", "+251-911-120001", "dire_dawa-tc3");
        seedUser("a0000001-0000-0000-0012-000000000002", "dd3.auditor2", "dd3.auditor2@mor.gov.et", "Sintayehu Jaleta", "AUDITOR", "joint_audit", "TAX_CENTER", "dire_dawa-tc3");
        seedAuditor("a0000001-0000-0000-0012-000000000002", "Sintayehu", "Jaleta", "Cross-Border & Transfer Pricing", "PRINCIPAL", 14, "dd3.auditor2@mor.gov.et", "+251-911-120002", "dire_dawa-tc3");
        seedUser("a0000001-0000-0000-0012-000000000003", "dd3.auditor3", "dd3.auditor3@mor.gov.et", "Tsion Keneni", "AUDITOR", "joint_audit", "TAX_CENTER", "dire_dawa-tc3");
        seedAuditor("a0000001-0000-0000-0012-000000000003", "Tsion", "Keneni", "Domestic VAT & Sales Reconciliation", "SENIOR", 9, "dd3.auditor3@mor.gov.et", "+251-911-120003", "dire_dawa-tc3");
        seedUser("a0000001-0000-0000-0012-000000000004", "dd3.auditor4", "dd3.auditor4@mor.gov.et", "Wubet Leta", "AUDITOR", "joint_audit", "TAX_CENTER", "dire_dawa-tc3");
        seedAuditor("a0000001-0000-0000-0012-000000000004", "Wubet", "Leta", "Corporate Income Tax & Deductions", "MID_LEVEL", 6, "dd3.auditor4@mor.gov.et", "+251-911-120004", "dire_dawa-tc3");
        seedUser("a0000001-0000-0000-0012-000000000005", "dd3.auditor5", "dd3.auditor5@mor.gov.et", "Yishak Merga", "AUDITOR", "joint_audit", "TAX_CENTER", "dire_dawa-tc3");
        seedAuditor("a0000001-0000-0000-0012-000000000005", "Yishak", "Merga", "Forensic & Investigation", "SENIOR", 11, "dd3.auditor5@mor.gov.et", "+251-911-120005", "dire_dawa-tc3");

        // ── SNNPR TC1 (snnpr-tc1) ──
        seedUser("20000000-0000-0000-0013-000000000001", "sn1.chair", "sn1.chair@mor.gov.et", "Dr. Zelalem Negeri", "COMMITTEE_CHAIR", "joint_audit", "TAX_CENTER", "snnpr-tc1");
        seedUser("20000000-0000-0000-0013-000000000002", "sn1.member", "sn1.member@mor.gov.et", "Amha Oromia", "COMMITTEE_MEMBER", "joint_audit", "TAX_CENTER", "snnpr-tc1");
        seedUser("10000000-0000-0000-0013-000000000001", "sn1.tl", "sn1.tl@mor.gov.et", "Biniyam Reta", "TEAM_LEADER", "joint_audit", "TAX_CENTER", "snnpr-tc1");
        seedUser("a0000001-0000-0000-0013-000000000001", "sn1.auditor1", "sn1.auditor1@mor.gov.et", "Elias Senbeta", "AUDITOR", "joint_audit", "TAX_CENTER", "snnpr-tc1");
        seedAuditor("a0000001-0000-0000-0013-000000000001", "Elias", "Senbeta", "Customs & Tariffs Valuation", "SENIOR", 10, "sn1.auditor1@mor.gov.et", "+251-911-130001", "snnpr-tc1");
        seedUser("a0000001-0000-0000-0013-000000000002", "sn1.auditor2", "sn1.auditor2@mor.gov.et", "Fisseha Tola", "AUDITOR", "joint_audit", "TAX_CENTER", "snnpr-tc1");
        seedAuditor("a0000001-0000-0000-0013-000000000002", "Fisseha", "Tola", "Cross-Border & Transfer Pricing", "PRINCIPAL", 14, "sn1.auditor2@mor.gov.et", "+251-911-130002", "snnpr-tc1");
        seedUser("a0000001-0000-0000-0013-000000000003", "sn1.auditor3", "sn1.auditor3@mor.gov.et", "Getachew Utalo", "AUDITOR", "joint_audit", "TAX_CENTER", "snnpr-tc1");
        seedAuditor("a0000001-0000-0000-0013-000000000003", "Getachew", "Utalo", "Domestic VAT & Sales Reconciliation", "SENIOR", 9, "sn1.auditor3@mor.gov.et", "+251-911-130003", "snnpr-tc1");
        seedUser("a0000001-0000-0000-0013-000000000004", "sn1.auditor4", "sn1.auditor4@mor.gov.et", "Hermela Wako", "AUDITOR", "joint_audit", "TAX_CENTER", "snnpr-tc1");
        seedAuditor("a0000001-0000-0000-0013-000000000004", "Hermela", "Wako", "Corporate Income Tax & Deductions", "MID_LEVEL", 6, "sn1.auditor4@mor.gov.et", "+251-911-130004", "snnpr-tc1");
        seedUser("a0000001-0000-0000-0013-000000000005", "sn1.auditor5", "sn1.auditor5@mor.gov.et", "Kidan Yadessa", "AUDITOR", "joint_audit", "TAX_CENTER", "snnpr-tc1");
        seedAuditor("a0000001-0000-0000-0013-000000000005", "Kidan", "Yadessa", "Forensic & Investigation", "SENIOR", 11, "sn1.auditor5@mor.gov.et", "+251-911-130005", "snnpr-tc1");

        // ── SNNPR TC2 (snnpr-tc2) ──
        seedUser("20000000-0000-0000-0014-000000000001", "sn2.chair", "sn2.chair@mor.gov.et", "Dr. Melaku Zeleke", "COMMITTEE_CHAIR", "joint_audit", "TAX_CENTER", "snnpr-tc2");
        seedUser("20000000-0000-0000-0014-000000000002", "sn2.member", "sn2.member@mor.gov.et", "Nurit Abinet", "COMMITTEE_MEMBER", "joint_audit", "TAX_CENTER", "snnpr-tc2");
        seedUser("10000000-0000-0000-0014-000000000001", "sn2.tl", "sn2.tl@mor.gov.et", "Rekik Birhanu", "TEAM_LEADER", "joint_audit", "TAX_CENTER", "snnpr-tc2");
        seedUser("a0000001-0000-0000-0014-000000000001", "sn2.auditor1", "sn2.auditor1@mor.gov.et", "Sisay Chemeda", "AUDITOR", "joint_audit", "TAX_CENTER", "snnpr-tc2");
        seedAuditor("a0000001-0000-0000-0014-000000000001", "Sisay", "Chemeda", "Customs & Tariffs Valuation", "SENIOR", 10, "sn2.auditor1@mor.gov.et", "+251-911-140001", "snnpr-tc2");
        seedUser("a0000001-0000-0000-0014-000000000002", "sn2.auditor2", "sn2.auditor2@mor.gov.et", "Tamirat Dibaba", "AUDITOR", "joint_audit", "TAX_CENTER", "snnpr-tc2");
        seedAuditor("a0000001-0000-0000-0014-000000000002", "Tamirat", "Dibaba", "Cross-Border & Transfer Pricing", "PRINCIPAL", 14, "sn2.auditor2@mor.gov.et", "+251-911-140002", "snnpr-tc2");
        seedUser("a0000001-0000-0000-0014-000000000003", "sn2.auditor3", "sn2.auditor3@mor.gov.et", "Weynshet Ejigu", "AUDITOR", "joint_audit", "TAX_CENTER", "snnpr-tc2");
        seedAuditor("a0000001-0000-0000-0014-000000000003", "Weynshet", "Ejigu", "Domestic VAT & Sales Reconciliation", "SENIOR", 9, "sn2.auditor3@mor.gov.et", "+251-911-140003", "snnpr-tc2");
        seedUser("a0000001-0000-0000-0014-000000000004", "sn2.auditor4", "sn2.auditor4@mor.gov.et", "Yosef Fufa", "AUDITOR", "joint_audit", "TAX_CENTER", "snnpr-tc2");
        seedAuditor("a0000001-0000-0000-0014-000000000004", "Yosef", "Fufa", "Corporate Income Tax & Deductions", "MID_LEVEL", 6, "sn2.auditor4@mor.gov.et", "+251-911-140004", "snnpr-tc2");
        seedUser("a0000001-0000-0000-0014-000000000005", "sn2.auditor5", "sn2.auditor5@mor.gov.et", "Zerihun Gidisa", "AUDITOR", "joint_audit", "TAX_CENTER", "snnpr-tc2");
        seedAuditor("a0000001-0000-0000-0014-000000000005", "Zerihun", "Gidisa", "Forensic & Investigation", "SENIOR", 11, "sn2.auditor5@mor.gov.et", "+251-911-140005", "snnpr-tc2");

        // ── SNNPR TC3 (snnpr-tc3) ──
        seedUser("20000000-0000-0000-0015-000000000001", "sn3.chair", "sn3.chair@mor.gov.et", "Dr. Anteneh Hordofa", "COMMITTEE_CHAIR", "joint_audit", "TAX_CENTER", "snnpr-tc3");
        seedUser("20000000-0000-0000-0015-000000000002", "sn3.member", "sn3.member@mor.gov.et", "Bogale Idossa", "COMMITTEE_MEMBER", "joint_audit", "TAX_CENTER", "snnpr-tc3");
        seedUser("10000000-0000-0000-0015-000000000001", "sn3.tl", "sn3.tl@mor.gov.et", "Endale Jibat", "TEAM_LEADER", "joint_audit", "TAX_CENTER", "snnpr-tc3");
        seedUser("a0000001-0000-0000-0015-000000000001", "sn3.auditor1", "sn3.auditor1@mor.gov.et", "Firew Kumela", "AUDITOR", "joint_audit", "TAX_CENTER", "snnpr-tc3");
        seedAuditor("a0000001-0000-0000-0015-000000000001", "Firew", "Kumela", "Customs & Tariffs Valuation", "SENIOR", 10, "sn3.auditor1@mor.gov.et", "+251-911-150001", "snnpr-tc3");
        seedUser("a0000001-0000-0000-0015-000000000002", "sn3.auditor2", "sn3.auditor2@mor.gov.et", "Gizachew Lamessa", "AUDITOR", "joint_audit", "TAX_CENTER", "snnpr-tc3");
        seedAuditor("a0000001-0000-0000-0015-000000000002", "Gizachew", "Lamessa", "Cross-Border & Transfer Pricing", "PRINCIPAL", 14, "sn3.auditor2@mor.gov.et", "+251-911-150002", "snnpr-tc3");
        seedUser("a0000001-0000-0000-0015-000000000003", "sn3.auditor3", "sn3.auditor3@mor.gov.et", "Hilina Mideksa", "AUDITOR", "joint_audit", "TAX_CENTER", "snnpr-tc3");
        seedAuditor("a0000001-0000-0000-0015-000000000003", "Hilina", "Mideksa", "Domestic VAT & Sales Reconciliation", "SENIOR", 9, "sn3.auditor3@mor.gov.et", "+251-911-150003", "snnpr-tc3");
        seedUser("a0000001-0000-0000-0015-000000000004", "sn3.auditor4", "sn3.auditor4@mor.gov.et", "Kumsa Nugusa", "AUDITOR", "joint_audit", "TAX_CENTER", "snnpr-tc3");
        seedAuditor("a0000001-0000-0000-0015-000000000004", "Kumsa", "Nugusa", "Corporate Income Tax & Deductions", "MID_LEVEL", 6, "sn3.auditor4@mor.gov.et", "+251-911-150004", "snnpr-tc3");
        seedUser("a0000001-0000-0000-0015-000000000005", "sn3.auditor5", "sn3.auditor5@mor.gov.et", "Michael Obse", "AUDITOR", "joint_audit", "TAX_CENTER", "snnpr-tc3");
        seedAuditor("a0000001-0000-0000-0015-000000000005", "Michael", "Obse", "Forensic & Investigation", "SENIOR", 11, "sn3.auditor5@mor.gov.et", "+251-911-150005", "snnpr-tc3");

        // ── Somali TC1 (somali-tc1) ──
        seedUser("20000000-0000-0000-0016-000000000001", "so1.chair", "so1.chair@mor.gov.et", "Dr. Nega Roba", "COMMITTEE_CHAIR", "joint_audit", "TAX_CENTER", "somali-tc1");
        seedUser("20000000-0000-0000-0016-000000000002", "so1.member", "so1.member@mor.gov.et", "Saba Sirika", "COMMITTEE_MEMBER", "joint_audit", "TAX_CENTER", "somali-tc1");
        seedUser("10000000-0000-0000-0016-000000000001", "so1.tl", "so1.tl@mor.gov.et", "Solomon Tucho", "TEAM_LEADER", "joint_audit", "TAX_CENTER", "somali-tc1");
        seedUser("a0000001-0000-0000-0016-000000000001", "so1.auditor1", "so1.auditor1@mor.gov.et", "Tewodros Urgesa", "AUDITOR", "joint_audit", "TAX_CENTER", "somali-tc1");
        seedAuditor("a0000001-0000-0000-0016-000000000001", "Tewodros", "Urgesa", "Customs & Tariffs Valuation", "SENIOR", 10, "so1.auditor1@mor.gov.et", "+251-911-160001", "somali-tc1");
        seedUser("a0000001-0000-0000-0016-000000000002", "so1.auditor2", "so1.auditor2@mor.gov.et", "Wolde Wayessa", "AUDITOR", "joint_audit", "TAX_CENTER", "somali-tc1");
        seedAuditor("a0000001-0000-0000-0016-000000000002", "Wolde", "Wayessa", "Cross-Border & Transfer Pricing", "PRINCIPAL", 14, "so1.auditor2@mor.gov.et", "+251-911-160002", "somali-tc1");
        seedUser("a0000001-0000-0000-0016-000000000003", "so1.auditor3", "so1.auditor3@mor.gov.et", "Yostina Yadete", "AUDITOR", "joint_audit", "TAX_CENTER", "somali-tc1");
        seedAuditor("a0000001-0000-0000-0016-000000000003", "Yostina", "Yadete", "Domestic VAT & Sales Reconciliation", "SENIOR", 9, "so1.auditor3@mor.gov.et", "+251-911-160003", "somali-tc1");
        seedUser("a0000001-0000-0000-0016-000000000004", "so1.auditor4", "so1.auditor4@mor.gov.et", "Zewditu Zelalem", "AUDITOR", "joint_audit", "TAX_CENTER", "somali-tc1");
        seedAuditor("a0000001-0000-0000-0016-000000000004", "Zewditu", "Zelalem", "Corporate Income Tax & Deductions", "MID_LEVEL", 6, "so1.auditor4@mor.gov.et", "+251-911-160004", "somali-tc1");
        seedUser("a0000001-0000-0000-0016-000000000005", "so1.auditor5", "so1.auditor5@mor.gov.et", "Amanuel Alebachew", "AUDITOR", "joint_audit", "TAX_CENTER", "somali-tc1");
        seedAuditor("a0000001-0000-0000-0016-000000000005", "Amanuel", "Alebachew", "Forensic & Investigation", "SENIOR", 11, "so1.auditor5@mor.gov.et", "+251-911-160005", "somali-tc1");

        // ── Somali TC2 (somali-tc2) ──
        seedUser("20000000-0000-0000-0017-000000000001", "so2.chair", "so2.chair@mor.gov.et", "Dr. Birhan Belete", "COMMITTEE_CHAIR", "joint_audit", "TAX_CENTER", "somali-tc2");
        seedUser("20000000-0000-0000-0017-000000000002", "so2.member", "so2.member@mor.gov.et", "Eskinder Chane", "COMMITTEE_MEMBER", "joint_audit", "TAX_CENTER", "somali-tc2");
        seedUser("10000000-0000-0000-0017-000000000001", "so2.tl", "so2.tl@mor.gov.et", "Frehiwot Damte", "TEAM_LEADER", "joint_audit", "TAX_CENTER", "somali-tc2");
        seedUser("a0000001-0000-0000-0017-000000000001", "so2.auditor1", "so2.auditor1@mor.gov.et", "Gosa Endalew", "AUDITOR", "joint_audit", "TAX_CENTER", "somali-tc2");
        seedAuditor("a0000001-0000-0000-0017-000000000001", "Gosa", "Endalew", "Customs & Tariffs Valuation", "SENIOR", 10, "so2.auditor1@mor.gov.et", "+251-911-170001", "somali-tc2");
        seedUser("a0000001-0000-0000-0017-000000000002", "so2.auditor2", "so2.auditor2@mor.gov.et", "Hundessa Fentaw", "AUDITOR", "joint_audit", "TAX_CENTER", "somali-tc2");
        seedAuditor("a0000001-0000-0000-0017-000000000002", "Hundessa", "Fentaw", "Cross-Border & Transfer Pricing", "PRINCIPAL", 14, "so2.auditor2@mor.gov.et", "+251-911-170002", "somali-tc2");
        seedUser("a0000001-0000-0000-0017-000000000003", "so2.auditor3", "so2.auditor3@mor.gov.et", "Leul Gashaw", "AUDITOR", "joint_audit", "TAX_CENTER", "somali-tc2");
        seedAuditor("a0000001-0000-0000-0017-000000000003", "Leul", "Gashaw", "Domestic VAT & Sales Reconciliation", "SENIOR", 9, "so2.auditor3@mor.gov.et", "+251-911-170003", "somali-tc2");
        seedUser("a0000001-0000-0000-0017-000000000004", "so2.auditor4", "so2.auditor4@mor.gov.et", "Million Hunegnaw", "AUDITOR", "joint_audit", "TAX_CENTER", "somali-tc2");
        seedAuditor("a0000001-0000-0000-0017-000000000004", "Million", "Hunegnaw", "Corporate Income Tax & Deductions", "MID_LEVEL", 6, "so2.auditor4@mor.gov.et", "+251-911-170004", "somali-tc2");
        seedUser("a0000001-0000-0000-0017-000000000005", "so2.auditor5", "so2.auditor5@mor.gov.et", "Nuredin Kindie", "AUDITOR", "joint_audit", "TAX_CENTER", "somali-tc2");
        seedAuditor("a0000001-0000-0000-0017-000000000005", "Nuredin", "Kindie", "Forensic & Investigation", "SENIOR", 11, "so2.auditor5@mor.gov.et", "+251-911-170005", "somali-tc2");

        // ── Somali TC3 (somali-tc3) ──
        seedUser("20000000-0000-0000-0018-000000000001", "so3.chair", "so3.chair@mor.gov.et", "Dr. Saron Mengesha", "COMMITTEE_CHAIR", "joint_audit", "TAX_CENTER", "somali-tc3");
        seedUser("20000000-0000-0000-0018-000000000002", "so3.member", "so3.member@mor.gov.et", "Surafel Nigusie", "COMMITTEE_MEMBER", "joint_audit", "TAX_CENTER", "somali-tc3");
        seedUser("10000000-0000-0000-0018-000000000001", "so3.tl", "so3.tl@mor.gov.et", "Tibebu Setegn", "TEAM_LEADER", "joint_audit", "TAX_CENTER", "somali-tc3");
        seedUser("a0000001-0000-0000-0018-000000000001", "so3.auditor1", "so3.auditor1@mor.gov.et", "Wondimu Tarekegn", "AUDITOR", "joint_audit", "TAX_CENTER", "somali-tc3");
        seedAuditor("a0000001-0000-0000-0018-000000000001", "Wondimu", "Tarekegn", "Customs & Tariffs Valuation", "SENIOR", 10, "so3.auditor1@mor.gov.et", "+251-911-180001", "somali-tc3");
        seedUser("a0000001-0000-0000-0018-000000000002", "so3.auditor2", "so3.auditor2@mor.gov.et", "Yabsira Wassie", "AUDITOR", "joint_audit", "TAX_CENTER", "somali-tc3");
        seedAuditor("a0000001-0000-0000-0018-000000000002", "Yabsira", "Wassie", "Cross-Border & Transfer Pricing", "PRINCIPAL", 14, "so3.auditor2@mor.gov.et", "+251-911-180002", "somali-tc3");
        seedUser("a0000001-0000-0000-0018-000000000003", "so3.auditor3", "so3.auditor3@mor.gov.et", "Zena Yimam", "AUDITOR", "joint_audit", "TAX_CENTER", "somali-tc3");
        seedAuditor("a0000001-0000-0000-0018-000000000003", "Zena", "Yimam", "Domestic VAT & Sales Reconciliation", "SENIOR", 9, "so3.auditor3@mor.gov.et", "+251-911-180003", "somali-tc3");
        seedUser("a0000001-0000-0000-0018-000000000004", "so3.auditor4", "so3.auditor4@mor.gov.et", "Kassaye Zewdu", "AUDITOR", "joint_audit", "TAX_CENTER", "somali-tc3");
        seedAuditor("a0000001-0000-0000-0018-000000000004", "Kassaye", "Zewdu", "Corporate Income Tax & Deductions", "MID_LEVEL", 6, "so3.auditor4@mor.gov.et", "+251-911-180004", "somali-tc3");
        seedUser("a0000001-0000-0000-0018-000000000005", "so3.auditor5", "so3.auditor5@mor.gov.et", "Negussie Admasu", "AUDITOR", "joint_audit", "TAX_CENTER", "somali-tc3");
        seedAuditor("a0000001-0000-0000-0018-000000000005", "Negussie", "Admasu", "Forensic & Investigation", "SENIOR", 11, "so3.auditor5@mor.gov.et", "+251-911-180005", "somali-tc3");

        // Ensure every other tax center (tcNum 2 to 18) also has TL2 and 10 auditors
        String[][] otherTcs = {
            {"addis_ababa-tc2", "aa2", "2"},
            {"addis_ababa-tc3", "aa3", "3"},
            {"oromia-tc1",      "or1", "4"},
            {"oromia-tc2",      "or2", "5"},
            {"oromia-tc3",      "or3", "6"},
            {"amhara-tc1",      "am1", "7"},
            {"amhara-tc2",      "am2", "8"},
            {"amhara-tc3",      "am3", "9"},
            {"dire_dawa-tc1",   "dd1", "10"},
            {"dire_dawa-tc2",   "dd2", "11"},
            {"dire_dawa-tc3",   "dd3", "12"},
            {"snnpr-tc1",       "sn1", "13"},
            {"snnpr-tc2",       "sn2", "14"},
            {"snnpr-tc3",       "sn3", "15"},
            {"somali-tc1",      "so1", "16"},
            {"somali-tc2",      "so2", "17"},
            {"somali-tc3",      "so3", "18"},
        };
        for (String[] tcInfo : otherTcs) {
            String tcId = tcInfo[0];
            String prefix = tcInfo[1];
            int num = Integer.parseInt(tcInfo[2]);

            // TL2
            String tl2Id = String.format("10000000-0000-0000-%04d-000000000002", num);
            seedUser(tl2Id, prefix + ".tl2", prefix + ".tl2@mor.gov.et",
                     prefix.toUpperCase() + " Team Leader 2", "TEAM_LEADER", "joint_audit", "TAX_CENTER", tcId);

            // Auditors 6 to 10
            for (int a = 6; a <= 10; a++) {
                String audId = String.format("a0000001-0000-0000-%04d-0000000000%02d", num, a);
                String un = prefix + ".auditor" + a;
                seedUser(audId, un, un + "@mor.gov.et",
                         prefix.toUpperCase() + " Auditor " + a, "AUDITOR", "joint_audit", "TAX_CENTER", tcId);
                seedAuditor(audId, prefix.toUpperCase() + "Auditor" + a, "Staff",
                            a % 2 == 0 ? "Corporate Tax" : "VAT Compliance",
                            a > 8 ? "PRINCIPAL" : "SENIOR", 8 + (a % 4),
                            un + "@mor.gov.et", "+251-911-" + String.format("%02d00%02d", num, a), tcId);
            }
        }
        // ════════════════════════════════════════════════════════════════════════════
        // 3. DESK AUDIT PERSONNEL (Federal LTO1 & LTO2)
        // ════════════════════════════════════════════════════════════════════════════
        
        // Federal LTO-1 Desk Audit Team Leaders
        seedUser("10000002-0000-0000-0001-000000000001", "u-tl-federal-lto1-desk-1", "u-tl-federal-lto1-desk-1@mor.gov.et", "Getnet Tesfa", "TEAM_LEADER", "DESK_AUDIT", "TAX_CENTER", "federal-lto1");
        seedUser("10000002-0000-0000-0001-000000000002", "u-tl-federal-lto1-desk-2", "u-tl-federal-lto1-desk-2@mor.gov.et", "Gemechu Alemu", "TEAM_LEADER", "DESK_AUDIT", "TAX_CENTER", "federal-lto1");
        
        // Federal LTO-2 Desk Audit Team Leaders
        seedUser("10000002-0000-0000-0002-000000000001", "u-tl-federal-lto2-desk-1", "u-tl-federal-lto2-desk-1@mor.gov.et", "Dawit Getachew", "TEAM_LEADER", "DESK_AUDIT", "TAX_CENTER", "federal-lto2");
        seedUser("10000002-0000-0000-0002-000000000002", "u-tl-federal-lto2-desk-2", "u-tl-federal-lto2-desk-2@mor.gov.et", "Haile Mideksa", "TEAM_LEADER", "DESK_AUDIT", "TAX_CENTER", "federal-lto2");
        
        // Federal LTO-1 Auditors (Team 1)
        seedUser("a0000002-0000-0000-0001-000000000001", "u-aud-federal-lto1-desk-1-1", "u-aud-federal-lto1-desk-1-1@mor.gov.et", "Tsega Mamo", "AUDITOR", "DESK_AUDIT", "TAX_CENTER", "federal-lto1");
        seedAuditor("a0000002-0000-0000-0001-000000000001", "Tsega", "Mamo", "General", "MID_LEVEL", 5, "u-aud-federal-lto1-desk-1-1@mor.gov.et", "+251-911-000001", "federal-lto1");
        seedUser("a0000002-0000-0000-0001-000000000002", "u-aud-federal-lto1-desk-1-2", "u-aud-federal-lto1-desk-1-2@mor.gov.et", "Abebe Kassa", "AUDITOR", "DESK_AUDIT", "TAX_CENTER", "federal-lto1");
        seedAuditor("a0000002-0000-0000-0001-000000000002", "Abebe", "Kassa", "General", "MID_LEVEL", 5, "u-aud-federal-lto1-desk-1-2@mor.gov.et", "+251-911-000002", "federal-lto1");
        
        // Federal LTO-1 Auditors (Team 2)
        seedUser("a0000002-0000-0000-0001-000000000003", "u-aud-federal-lto1-desk-2-1", "u-aud-federal-lto1-desk-2-1@mor.gov.et", "Abebe Lemma", "AUDITOR", "DESK_AUDIT", "TAX_CENTER", "federal-lto1");
        seedAuditor("a0000002-0000-0000-0001-000000000003", "Abebe", "Lemma", "General", "MID_LEVEL", 5, "u-aud-federal-lto1-desk-2-1@mor.gov.et", "+251-911-000003", "federal-lto1");
        seedUser("a0000002-0000-0000-0001-000000000004", "u-aud-federal-lto1-desk-2-2", "u-aud-federal-lto1-desk-2-2@mor.gov.et", "Almaw Gebre", "AUDITOR", "DESK_AUDIT", "TAX_CENTER", "federal-lto1");
        seedAuditor("a0000002-0000-0000-0001-000000000004", "Almaw", "Gebre", "General", "MID_LEVEL", 5, "u-aud-federal-lto1-desk-2-2@mor.gov.et", "+251-911-000004", "federal-lto1");
        
        // Federal LTO-2 Auditors (Team 1)
        seedUser("a0000002-0000-0000-0002-000000000001", "u-aud-federal-lto2-desk-1-1", "u-aud-federal-lto2-desk-1-1@mor.gov.et", "Birtukan Kassa", "AUDITOR", "DESK_AUDIT", "TAX_CENTER", "federal-lto2");
        seedAuditor("a0000002-0000-0000-0002-000000000001", "Birtukan", "Kassa", "General", "MID_LEVEL", 5, "u-aud-federal-lto2-desk-1-1@mor.gov.et", "+251-911-000005", "federal-lto2");
        seedUser("a0000002-0000-0000-0002-000000000002", "u-aud-federal-lto2-desk-1-2", "u-aud-federal-lto2-desk-1-2@mor.gov.et", "Genet Worku", "AUDITOR", "DESK_AUDIT", "TAX_CENTER", "federal-lto2");
        seedAuditor("a0000002-0000-0000-0002-000000000002", "Genet", "Worku", "General", "MID_LEVEL", 5, "u-aud-federal-lto2-desk-1-2@mor.gov.et", "+251-911-000006", "federal-lto2");
        
        // Federal LTO-2 Auditors (Team 2)
        seedUser("a0000002-0000-0000-0002-000000000003", "u-aud-federal-lto2-desk-2-1", "u-aud-federal-lto2-desk-2-1@mor.gov.et", "Genet Gebre", "AUDITOR", "DESK_AUDIT", "TAX_CENTER", "federal-lto2");
        seedAuditor("a0000002-0000-0000-0002-000000000003", "Genet", "Gebre", "General", "MID_LEVEL", 5, "u-aud-federal-lto2-desk-2-1@mor.gov.et", "+251-911-000007", "federal-lto2");
        seedUser("a0000002-0000-0000-0002-000000000004", "u-aud-federal-lto2-desk-2-2", "u-aud-federal-lto2-desk-2-2@mor.gov.et", "Henok Abera", "AUDITOR", "DESK_AUDIT", "TAX_CENTER", "federal-lto2");
        seedAuditor("a0000002-0000-0000-0002-000000000004", "Henok", "Abera", "General", "MID_LEVEL", 5, "u-aud-federal-lto2-desk-2-2@mor.gov.et", "+251-911-000008", "federal-lto2");

        log.info("[UserDataSeeder] ✓ Seeded {} total users into t_user and {} auditors into t_auditor",
                 userJpaRepo.count(), auditorRepo.count());
    }

    private void seedUser(String id, String rawUsername, String rawEmail, String fullName,
                          String userType, String auditType, String level, String location) {
        String username = mor.itas.engineadapter.usermanagement.MockUserManagementAdapter.toPrefixedUsername(rawUsername, userType);
        String rolePrefix = mor.itas.engineadapter.usermanagement.MockUserManagementAdapter.getRolePrefix(userType);
        String cleanName = fullName.replace("Dr. ", "").replace("Dr.", "").replaceAll("\\s*\\([^)]*\\)", "").trim();
        String[] parts = cleanName.split("\\s+");
        String namePart;
        if (cleanName.toLowerCase().startsWith("manager") || cleanName.toLowerCase().startsWith("joint") || parts.length < 2) {
            namePart = username.toLowerCase().replace("-", ".");
        } else {
            namePart = (parts[0].toLowerCase() + "." + parts[parts.length - 1].toLowerCase()).replaceAll("[^a-z0-9.]", "");
        }
        String candidate = rolePrefix + "." + namePart;
        String email = candidate + "@mor.gov.et";
        if (assignedEmails.contains(email)) {
            int seq = 2;
            while (assignedEmails.contains(candidate + seq + "@mor.gov.et")) {
                seq++;
            }
            email = candidate + seq + "@mor.gov.et";
        }
        assignedEmails.add(email);

        if (assignedUsernames.contains(username)) {
            int seq = 2;
            while (assignedUsernames.contains(username + "-" + seq)) {
                seq++;
            }
            username = username + "-" + seq;
        }
        assignedUsernames.add(username);

        UserEntity entity = UserEntity.builder()
                .userId(UUID.fromString(id))
                .username(username)
                .email(email)
                .fullName(fullName)
                .userType(userType)
                .auditType(auditType)
                .assignedLevel(level != null ? level : "TAX_CENTER")
                .assignedLocation(location)
                .status("ACTIVE")
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();
        userJpaRepo.save(entity);
    }

    private void seedAuditor(String id, String firstName, String lastName, String expertise,
                             String seniority, int yearsExp, String rawEmail, String phone, String taxCenter) {
        String cleanFirst = firstName.replaceAll("[^a-zA-Z]", "").toLowerCase();
        String cleanLast = lastName.replaceAll("[^a-zA-Z]", "").toLowerCase();
        String email = "auditor." + cleanFirst + "." + cleanLast + "@mor.gov.et";
        AuditorEntity auditor = AuditorEntity.builder()
                .auditorId(UUID.fromString(id))
                .firstName(firstName)
                .lastName(lastName)
                .expertise(expertise)
                .seniority(seniority)
                .yearsOfExperience(yearsExp)
                .email(email)
                .phone(phone)
                .taxCenter(taxCenter)
                .active(true)
                .currentCases(0)
                .maxCases(5)
                .build();
        auditorRepo.save(auditor);
    }
}
