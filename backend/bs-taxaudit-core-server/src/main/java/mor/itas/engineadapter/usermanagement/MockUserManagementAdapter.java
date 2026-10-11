package mor.itas.engineadapter.usermanagement;

import mor.itas.application.port.outboundport.usermanagement.UserManagementPort;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Mock User Management Adapter — Complete user directory for the ITAS Audit System.
 *
 * Hierarchy:
 *   NATIONAL  → Planning Team, Director, Senior Mgmt, Committees, Audit Requesters
 *   REGIONAL  → Regional Directors (Federal + 6 Regions)
 *   TAX_CENTER → Manager, Team Leaders (per audit type, numbered), Auditors (per TL, numbered)
 *
 * Tax-center IDs use the frontend-canonical format:
 *   federal-lto1, federal-lto2
 *   addis_ababa-tc1, addis_ababa-tc2, addis_ababa-tc3
 *   amhara-tc1, amhara-tc2, amhara-tc3
 *   oromia-tc1, oromia-tc2, oromia-tc3
 *   dire_dawa-tc1, dire_dawa-tc2, dire_dawa-tc3
 *   snnpr-tc1, snnpr-tc2, snnpr-tc3
 *   somali-tc1, somali-tc2, somali-tc3
 *
 * Audit types (backend IDs): DESK_AUDIT, FIELD_AUDIT, JOINT_AUDIT, TRANSFER_PRICING, COMPREHENSIVE_AUDIT, ISSUE_AUDIT
 */
@Component
@Profile("mock")
public class MockUserManagementAdapter implements UserManagementPort {

    private static final Map<String, Map<String, Object>> USERS = new LinkedHashMap<>();
    private static final Map<String, Map<String, Object>> USER_LOOKUP = new ConcurrentHashMap<>();
    private static final Set<String> ASSIGNED_EMAILS = new HashSet<>();
    private static final Set<String> ASSIGNED_USERNAMES = new HashSet<>();

    // Ethiopian names pool
    private static final String[] FIRST_NAMES = {
        "Abebe","Almaw","Tadesse","Workneh","Almaz","Tigist","Ephrem","Abdi",
        "Hassen","Mamo","Kassa","Bikila","Tekle","Haile","Dawit","Meron",
        "Selam","Bereket","Solomon","Getnet","Gemechu","Ibrahim","Yonas",
        "Chaltu","Fatuma","Kassahun","Tirhas","Mekdes","Dereje","Lalisa",
        "Birtukan","Genet","Henok","Seble","Sara","Fikadu","Bethlehem",
        "Yosef","Eleni","Nardos","Addis","Kidist","Robel","Natnael",
        "Yodit","Samuel","Eden","Meseret","Amanuel","Ruth","Tewodros",
        "Mesfin","Fikremariam","Saron","Michael","Eyerusalem","Abdi",
        "Mahlet","Tolera","Diriba","Mulugeta","Rahel","Berihun","Tsega"
    };
    private static final String[] LAST_NAMES = {
        "Getachew","Tesfa","Alemu","Bekele","Kebede","Mekonnen","Tilahun",
        "Assefa","Girma","Belay","Tadesse","Mamo","Kassa","Worku","Haile",
        "Negash","Zewde","Bikila","Tesfaye","Mulugeta","Lemma","Gebre",
        "Abera","Wolde","Berhane","Desta","Kifle","Alemayehu","Banti",
        "Wakjira","Mengistu","Hassan","Yohannes","Mideksa"
    };
    private static int employeeCounter = 4200;

    static {
        initializeUsers();
    }

    // ───────── NATIONAL LEVEL ─────────

    private static void initializeUsers() {

        // ── Planning Team ──
        addUser("u-pt-01", "u-pt-01", "eden.haile@mor.gov.et",
                "Eden Haile", "PLANNING_TEAM", null, "NATIONAL", "FEDERAL");
        addUser("u-pt-02", "u-pt-02", "samuel.worku@mor.gov.et",
                "Samuel Worku", "PLANNING_TEAM", null, "NATIONAL", "FEDERAL");
        addUser("u-pt-03", "u-pt-03", "yodit.kassa@mor.gov.et",
                "Yodit Kassa", "PLANNING_TEAM", null, "NATIONAL", "FEDERAL");

        // ── Director ──
        addUser("u-ad-01", "u-ad-01", "getnet.bekele@mor.gov.et",
                "Getnet Bekele", "DIRECTOR", null, "NATIONAL", "FEDERAL");
        addUser("u-ad-02", "u-ad-02", "gemechu.kebede@mor.gov.et",
                "Gemechu Kebede", "DIRECTOR", null, "NATIONAL", "FEDERAL");

        // ── Senior Management ──
        addUser("u-sm-01", "u-sm-01", "almaz.berhane@mor.gov.et",
                "Almaz Berhane", "SENIOR_MANAGEMENT", null, "NATIONAL", "FEDERAL");
        addUser("u-sm-02", "u-sm-02", "workneh.wolde@mor.gov.et",
                "Workneh Wolde", "SENIOR_MANAGEMENT", null, "NATIONAL", "FEDERAL");

        // ── Quality Assurance Directorate (ISO 19011 / SOR FR-04.5) ──
        addUser("u-qa-officer-1", "qa.officer1", "qa.officer1@mor.gov.et",
                "Rahel Tesfaye", "QA_OFFICER", "QUALITY_ASSURANCE", "NATIONAL", "FEDERAL");
        addUser("u-qa-officer-2", "qa.officer2", "qa.officer2@mor.gov.et",
                "Biniyam Girma", "QA_OFFICER", "QUALITY_ASSURANCE", "NATIONAL", "FEDERAL");
        addUser("u-qa-tl-1", "qa.tl1", "qa.tl1@mor.gov.et",
                "Tewodros Mekonnen", "QA_TEAM_LEADER", "QUALITY_ASSURANCE", "NATIONAL", "FEDERAL");
        addUser("u-qa-director-1", "qa.director", "qa.director@mor.gov.et",
                "Dr. Mesfin Alemayehu", "QA_DIRECTOR", "QUALITY_ASSURANCE", "NATIONAL", "FEDERAL");

        // ── Federal LTO-1 Joint Audit Personnel ──
        addUser("20000000-0000-0000-0099-000000000001", "fed.ja.chair", "fed.ja.chair@mor.gov.et",
                "Dr. Solomon Desta", "COMMITTEE_CHAIR", "JOINT_AUDIT", "TAX_CENTER", "federal-lto1");
        addUser("20000000-0000-0000-0099-000000000002", "fed.ja.member", "fed.ja.member@mor.gov.et",
                "Eleni Tesfaye", "COMMITTEE_MEMBER", "JOINT_AUDIT", "TAX_CENTER", "federal-lto1");
        addUser("10000000-0000-0000-0099-000000000001", "fed.ja.tl", "fed.ja.tl@mor.gov.et",
                "Abebe Haile", "TEAM_LEADER", "JOINT_AUDIT", "TAX_CENTER", "federal-lto1");
        addUser("10000000-0000-0000-0099-000000000002", "fed.ja.tl2", "fed.ja.tl2@mor.gov.et",
                "Nardos Negash", "TEAM_LEADER", "JOINT_AUDIT", "TAX_CENTER", "federal-lto1");
        addUser("a0000001-0000-0000-0099-000000000001", "fed.ja.auditor1", "fed.ja.auditor1@mor.gov.et",
                "Fikremariam Tilahun", "AUDITOR", "JOINT_AUDIT", "TAX_CENTER", "federal-lto1");
        addUser("a0000001-0000-0000-0099-000000000002", "fed.ja.auditor2", "fed.ja.auditor2@mor.gov.et",
                "Saron Assefa", "AUDITOR", "JOINT_AUDIT", "TAX_CENTER", "federal-lto1");
        addUser("a0000001-0000-0000-0099-000000000003", "fed.ja.auditor3", "fed.ja.auditor3@mor.gov.et",
                "Bikila Worku", "AUDITOR", "JOINT_AUDIT", "TAX_CENTER", "federal-lto1");
        addUser("a0000001-0000-0000-0099-000000000004", "fed.ja.auditor4", "fed.ja.auditor4@mor.gov.et",
                "Michael Zewde", "AUDITOR", "JOINT_AUDIT", "TAX_CENTER", "federal-lto1");
        addUser("a0000001-0000-0000-0099-000000000005", "fed.ja.auditor5", "fed.ja.auditor5@mor.gov.et",
                "Saron Negash", "AUDITOR", "JOINT_AUDIT", "TAX_CENTER", "federal-lto1");
        addUser("a0000001-0000-0000-0099-000000000006", "fed.ja.auditor6", "fed.ja.auditor6@mor.gov.et",
                "Almaw Tesfa", "AUDITOR", "JOINT_AUDIT", "TAX_CENTER", "federal-lto1");
        addUser("a0000001-0000-0000-0099-000000000007", "fed.ja.auditor7", "fed.ja.auditor7@mor.gov.et",
                "Tigist Alemu", "AUDITOR", "JOINT_AUDIT", "TAX_CENTER", "federal-lto1");
        addUser("a0000001-0000-0000-0099-000000000008", "fed.ja.auditor8", "fed.ja.auditor8@mor.gov.et",
                "Ephrem Bekele", "AUDITOR", "JOINT_AUDIT", "TAX_CENTER", "federal-lto1");
        addUser("a0000001-0000-0000-0099-000000000009", "fed.ja.auditor9", "fed.ja.auditor9@mor.gov.et",
                "Meron Kebede", "AUDITOR", "JOINT_AUDIT", "TAX_CENTER", "federal-lto1");
        addUser("a0000001-0000-0000-0099-000000000010", "fed.ja.auditor10", "fed.ja.auditor10@mor.gov.et",
                "Bereket Mekonnen", "AUDITOR", "JOINT_AUDIT", "TAX_CENTER", "federal-lto1");

        // ── Federal LTO-2 Joint Audit Personnel ──
        addUser("20000000-0000-0000-0098-000000000001", "fed2.ja.chair", "fed2.ja.chair@mor.gov.et",
                "Dr. Worku Alemayehu", "COMMITTEE_CHAIR", "JOINT_AUDIT", "TAX_CENTER", "federal-lto2");
        addUser("20000000-0000-0000-0098-000000000002", "fed2.ja.member", "fed2.ja.member@mor.gov.et",
                "Tigist Hailu", "COMMITTEE_MEMBER", "JOINT_AUDIT", "TAX_CENTER", "federal-lto2");
        addUser("10000000-0000-0000-0098-000000000001", "fed2.ja.tl", "fed2.ja.tl@mor.gov.et",
                "Berhanu Bekele", "TEAM_LEADER", "JOINT_AUDIT", "TAX_CENTER", "federal-lto2");
        addUser("10000000-0000-0000-0098-000000000002", "fed2.ja.tl2", "fed2.ja.tl2@mor.gov.et",
                "Eleni Banti", "TEAM_LEADER", "JOINT_AUDIT", "TAX_CENTER", "federal-lto2");
        addUser("a0000001-0000-0000-0098-000000000001", "fed2.ja.auditor1", "fed2.ja.auditor1@mor.gov.et",
                "Dawit Mengistu", "AUDITOR", "JOINT_AUDIT", "TAX_CENTER", "federal-lto2");
        addUser("a0000001-0000-0000-0098-000000000002", "fed2.ja.auditor2", "fed2.ja.auditor2@mor.gov.et",
                "Eden Tadesse", "AUDITOR", "JOINT_AUDIT", "TAX_CENTER", "federal-lto2");
        addUser("a0000001-0000-0000-0098-000000000003", "fed2.ja.auditor3", "fed2.ja.auditor3@mor.gov.et",
                "Henok Girma", "AUDITOR", "JOINT_AUDIT", "TAX_CENTER", "federal-lto2");
        addUser("a0000001-0000-0000-0098-000000000004", "fed2.ja.auditor4", "fed2.ja.auditor4@mor.gov.et",
                "Meron Kebede", "AUDITOR", "JOINT_AUDIT", "TAX_CENTER", "federal-lto2");
        addUser("a0000001-0000-0000-0098-000000000005", "fed2.ja.auditor5", "fed2.ja.auditor5@mor.gov.et",
                "Natnael Assefa", "AUDITOR", "JOINT_AUDIT", "TAX_CENTER", "federal-lto2");
        addUser("a0000001-0000-0000-0098-000000000006", "fed2.ja.auditor6", "fed2.ja.auditor6@mor.gov.et",
                "Fikadu Wolde", "AUDITOR", "JOINT_AUDIT", "TAX_CENTER", "federal-lto2");
        addUser("a0000001-0000-0000-0098-000000000007", "fed2.ja.auditor7", "fed2.ja.auditor7@mor.gov.et",
                "Genet Alemu", "AUDITOR", "JOINT_AUDIT", "TAX_CENTER", "federal-lto2");
        addUser("a0000001-0000-0000-0098-000000000008", "fed2.ja.auditor8", "fed2.ja.auditor8@mor.gov.et",
                "Habtamu Desta", "AUDITOR", "JOINT_AUDIT", "TAX_CENTER", "federal-lto2");
        addUser("a0000001-0000-0000-0098-000000000009", "fed2.ja.auditor9", "fed2.ja.auditor9@mor.gov.et",
                "Selam Haile", "AUDITOR", "JOINT_AUDIT", "TAX_CENTER", "federal-lto2");
        addUser("a0000001-0000-0000-0098-000000000010", "fed2.ja.auditor10", "fed2.ja.auditor10@mor.gov.et",
                "Getnet Alemayehu", "AUDITOR", "JOINT_AUDIT", "TAX_CENTER", "federal-lto2");

        // ── Regional Committee Chairs (Joint & TP) ──
        addUser("20000000-0000-0000-0001-000000000001", "aa1.chair", "aa1.chair@mor.gov.et",
                "Dr. Abebe Kebede", "COMMITTEE_CHAIR", "JOINT_AUDIT", "TAX_CENTER", "addis_ababa-tc1");
        addUser("20000000-0000-0000-0001-000000000002", "aa1.member", "aa1.member@mor.gov.et",
                "Fatuma Ahmed", "COMMITTEE_MEMBER", "JOINT_AUDIT", "TAX_CENTER", "addis_ababa-tc1");
        addUser("10000000-0000-0000-0001-000000000001", "aa1.tl", "aa1.tl@mor.gov.et",
                "Dawit Tadesse", "TEAM_LEADER", "JOINT_AUDIT", "TAX_CENTER", "addis_ababa-tc1");
        addUser("10000000-0000-0000-0001-000000000002", "aa1.tl2", "aa1.tl2@mor.gov.et",
                "Robel Girma", "TEAM_LEADER", "JOINT_AUDIT", "TAX_CENTER", "addis_ababa-tc1");
        String[] aaAuditorNames = {
            "Sara Mohammed", "Yonas Berhanu", "Hana Girma", "Mulugeta Alemayehu", "Tigist Haile",
            "Kassahun Tekle", "Meron Desta", "Bereket Wolde", "Solomon Lemma", "Bethlehem Kebede"
        };
        for (int i = 1; i <= 10; i++) {
            String audId = String.format("a0000001-0000-0000-0001-0000000000%02d", i);
            String un = "aa1.auditor" + i;
            addUser(audId, un, un + "@mor.gov.et",
                    aaAuditorNames[i - 1], "AUDITOR", "JOINT_AUDIT", "TAX_CENTER", "addis_ababa-tc1");
        }
        addUser("u-com-aa-tpchair", "u-com-aa-tpchair", "aa.tpchair@mor.gov.et",
                "TP Committee Chair AA", "COMMITTEE_CHAIR", "TRANSFER_PRICING", "TAX_CENTER", "addis_ababa-tc1");
        addUser("20000000-0000-0000-0004-000000000001", "or1.chair", "or1.chair@mor.gov.et",
                "Dr. Chaltu Negash", "COMMITTEE_CHAIR", "JOINT_AUDIT", "TAX_CENTER", "oromia-tc1");
        addUser("20000000-0000-0000-0004-000000000002", "or1.member", "or1.member@mor.gov.et",
                "Diriba Lema", "COMMITTEE_MEMBER", "JOINT_AUDIT", "TAX_CENTER", "oromia-tc1");
        addUser("20000000-0000-0000-0007-000000000001", "am1.chair", "am1.chair@mor.gov.et",
                "Dr. Tadesse Kebede", "COMMITTEE_CHAIR", "JOINT_AUDIT", "TAX_CENTER", "amhara-tc1");
        addUser("20000000-0000-0000-0007-000000000002", "am1.member", "am1.member@mor.gov.et",
                "Almaz Kassa", "COMMITTEE_MEMBER", "JOINT_AUDIT", "TAX_CENTER", "amhara-tc1");
        addUser("20000000-0000-0000-0010-000000000001", "dd1.chair", "dd1.chair@mor.gov.et",
                "Dr. Yonas Mengistu", "COMMITTEE_CHAIR", "JOINT_AUDIT", "TAX_CENTER", "dire_dawa-tc1");
        addUser("20000000-0000-0000-0013-000000000001", "sn1.chair", "sn1.chair@mor.gov.et",
                "Dr. Tekle Lemma", "COMMITTEE_CHAIR", "JOINT_AUDIT", "TAX_CENTER", "snnpr-tc1");
        addUser("20000000-0000-0000-0016-000000000001", "so1.chair", "so1.chair@mor.gov.et",
                "Dr. Ibrahim Hassan", "COMMITTEE_CHAIR", "JOINT_AUDIT", "TAX_CENTER", "somali-tc1");

        // ── JA Committee (Federal) ──
        addUser("u-com-fed-chair", "u-com-fed-chair", "nardos.belay@mor.gov.et",
                "Nardos Belay", "COMMITTEE_CHAIR", "JOINT_AUDIT", "NATIONAL", "FEDERAL");
        addUser("u-com-fed-mem1", "u-com-fed-mem1", "fatuma.abera@mor.gov.et",
                "Fatuma Abera", "COMMITTEE_MEMBER", "JOINT_AUDIT", "NATIONAL", "FEDERAL");
        addUser("u-com-fed-mem2", "u-com-fed-mem2", "kassahun.desta@mor.gov.et",
                "Kassahun Desta", "COMMITTEE_MEMBER", "JOINT_AUDIT", "NATIONAL", "FEDERAL");

        // ── TP Committee (Federal) ──
        addUser("u-com-fed-tpchair", "u-com-fed-tpchair", "fikadu.belay@mor.gov.et",
                "Fikadu Belay", "COMMITTEE_CHAIR", "TRANSFER_PRICING", "NATIONAL", "FEDERAL");
        addUser("u-com-fed-tpmem1", "u-com-fed-tpmem1", "dereje.kebede@mor.gov.et",
                "Dereje Kebede", "COMMITTEE_MEMBER", "TRANSFER_PRICING", "NATIONAL", "FEDERAL");
        addUser("u-com-fed-tpmem2", "u-com-fed-tpmem2", "ruth.tadesse@mor.gov.et",
                "Ruth Tadesse", "COMMITTEE_MEMBER", "TRANSFER_PRICING", "NATIONAL", "FEDERAL");

        // ── Desk Audit Committee (Federal) ──
        addUser("u-com-fed-deskchair", "u-com-fed-deskchair", "tigist.alemu@mor.gov.et",
                "Tigist Alemu", "COMMITTEE_CHAIR", "DESK_AUDIT", "NATIONAL", "FEDERAL");
        addUser("u-com-fed-deskmem1", "u-com-fed-deskmem1", "ephrem.bekele@mor.gov.et",
                "Ephrem Bekele", "COMMITTEE_MEMBER", "DESK_AUDIT", "NATIONAL", "FEDERAL");

        // ── Comprehensive Audit Committee (Federal) ──
        addUser("u-com-fed-compchair", "u-com-fed-compchair", "mamo.bekele@mor.gov.et",
                "Mamo Bekele", "COMMITTEE_CHAIR", "COMPREHENSIVE_AUDIT", "NATIONAL", "FEDERAL");
        addUser("u-com-fed-compmem1", "u-com-fed-compmem1", "kassa.kebede@mor.gov.et",
                "Kassa Kebede", "COMMITTEE_MEMBER", "COMPREHENSIVE_AUDIT", "NATIONAL", "FEDERAL");

        // ── Issue Audit Committee (Federal) ──
        addUser("u-com-fed-issuechair", "u-com-fed-issuechair", "kassahun.assefa@mor.gov.et",
                "Kassahun Assefa", "COMMITTEE_CHAIR", "ISSUE_AUDIT", "NATIONAL", "FEDERAL");
        addUser("u-com-fed-issuemem1", "u-com-fed-issuemem1", "fatuma.tilahun@mor.gov.et",
                "Fatuma Tilahun", "COMMITTEE_MEMBER", "ISSUE_AUDIT", "NATIONAL", "FEDERAL");

        // ── Audit Requesters (internal & external directorates) ──
        addUser("u-req-01", "u-req-01", "getachew.zewde@mor.gov.et",
                "Getachew Zewde", "AUDIT_REQUESTER", null, "NATIONAL", "FEDERAL");
        addUser("u-req-02", "u-req-02", "tigist.worku@mor.gov.et",
                "Tigist Worku", "AUDIT_REQUESTER", null, "NATIONAL", "FEDERAL");
        addUser("u-req-03", "u-req-03", "deriba.alemayehu@mor.gov.et",
                "Deriba Alemayehu", "AUDIT_REQUESTER", null, "NATIONAL", "FEDERAL");
        addUser("u-req-04", "u-req-04", "external.motri@gov.et",
                "Ministry of Trade", "AUDIT_REQUESTER", null, "NATIONAL", "FEDERAL");

        // ───────── REGIONAL LEVEL ─────────
        // One Regional Director per region
        addUser("u-rd-fed", "u-rd-fed", "berihun.lemma@mor.gov.et",
                "Berihun Lemma", "REGIONAL_DIRECTOR", null, "REGIONAL", "FED");
        addUser("u-rd-aa", "u-rd-aa", "getnet.alemu@mor.gov.et",
                "Getnet Alemu", "REGIONAL_DIRECTOR", null, "REGIONAL", "AA");
        addUser("u-rd-am", "u-rd-am", "tadesse.kebede@mor.gov.et",
                "Tadesse Kebede", "REGIONAL_DIRECTOR", null, "REGIONAL", "BA");
        addUser("u-rd-or", "u-rd-or", "gemechu.negash@mor.gov.et",
                "Gemechu Negash", "REGIONAL_DIRECTOR", null, "REGIONAL", "BB");
        addUser("u-rd-dd", "u-rd-dd", "yonas.mengistu@mor.gov.et",
                "Yonas Mengistu", "REGIONAL_DIRECTOR", null, "REGIONAL", "AB");
        addUser("u-rd-sn", "u-rd-sn", "tekle.lemma@mor.gov.et",
                "Tekle Lemma", "REGIONAL_DIRECTOR", null, "REGIONAL", "CA");
        addUser("u-rd-so", "u-rd-so", "ibrahim.hassan@mor.gov.et",
                "Ibrahim Hassan", "REGIONAL_DIRECTOR", null, "REGIONAL", "SO");

        // ───────── TAX CENTER LEVEL ─────────
        // Each tax center gets: 1 Manager + per audit type (2 TLs + 2 Aud per TL)

        String[][] taxCenterDefs = {
            // { tcId,              regionCode, shortLabel }
            {"federal-lto1",     "FED", "FED-LTO1"},
            {"federal-lto2",     "FED", "FED-LTO2"},
            {"addis_ababa-tc1",  "AA",  "AA-TC1"},
            {"addis_ababa-tc2",  "AA",  "AA-TC2"},
            {"addis_ababa-tc3",  "AA",  "AA-TC3"},
            {"amhara-tc1",       "BA",  "BA-TC1"},
            {"amhara-tc2",       "BA",  "BA-TC2"},
            {"amhara-tc3",       "BA",  "BA-TC3"},
            {"oromia-tc1",       "BB",  "BB-TC1"},
            {"oromia-tc2",       "BB",  "BB-TC2"},
            {"oromia-tc3",       "BB",  "BB-TC3"},
            {"dire_dawa-tc1",    "AB",  "AB-TC1"},
            {"dire_dawa-tc2",    "AB",  "AB-TC2"},
            {"dire_dawa-tc3",    "AB",  "AB-TC3"},
            {"snnpr-tc1",        "CA",  "CA-TC1"},
            {"snnpr-tc2",        "CA",  "CA-TC2"},
            {"snnpr-tc3",        "CA",  "CA-TC3"},
            {"somali-tc1",       "SO",  "SO-TC1"},
            {"somali-tc2",       "SO",  "SO-TC2"},
            {"somali-tc3",       "SO",  "SO-TC3"},
        };

        // 5 audit types that match the frontend
        String[][] auditTypeDefs = {
            // { backendId,              shortLabel }
            {"DESK_AUDIT",          "Desk"},
            {"JOINT_AUDIT",         "Joint"},
            {"TRANSFER_PRICING",    "TP"},
            {"COMPREHENSIVE_AUDIT", "Comp"},
            {"ISSUE_AUDIT",         "Issue"},
        };

        for (String[] tcDef : taxCenterDefs) {
            String tcId = tcDef[0];
            String tcShort = tcDef[2];

            // Tax Center Manager
            String tcmId = "u-tcm-" + tcId;
            String tcmName = "federal-lto1".equals(tcId) ? "Tsega Mulugeta"
                           : "federal-lto2".equals(tcId) ? "Berihun Tesfaye"
                           : "Tax Center Manager " + tcShort;
            addUser(tcmId, tcmId, null,
                    tcmName, "TAX_CENTER_MANAGER", null, "TAX_CENTER", tcId);

            // JA Committee at this TC (only if not already registered above)
            if (!"federal-lto1".equals(tcId) && !"federal-lto2".equals(tcId) && !"addis_ababa-tc1".equals(tcId)
                && !"oromia-tc1".equals(tcId) && !"amhara-tc1".equals(tcId) && !"dire_dawa-tc1".equals(tcId)
                && !"snnpr-tc1".equals(tcId) && !"somali-tc1".equals(tcId)) {
                String jaChairId = "u-com-" + tcId + "-ja";
                addUser(jaChairId, jaChairId, jaChairId + "@mor.gov.et",
                        "Joint Committee Chair (" + tcShort + ")", "COMMITTEE_CHAIR", "JOINT_AUDIT", "TAX_CENTER", tcId);
            }
            // TP Committee at this TC
            String tpChairId = "u-com-" + tcId + "-tp";
            addUser(tpChairId, tpChairId, tpChairId + "@mor.gov.et",
                    "TP Committee Chair (" + tcShort + ")", "COMMITTEE_MEMBER", "TRANSFER_PRICING", "TAX_CENTER", tcId);

            for (String[] atDef : auditTypeDefs) {
                String auditType = atDef[0];
                String atShort = atDef[1];

                if ("JOINT_AUDIT".equals(auditType)) {
                    // If this tax center already has dedicated Joint Audit TLs and auditors, do not add duplicates!
                    if ("federal-lto1".equals(tcId) || "federal-lto2".equals(tcId) || "addis_ababa-tc1".equals(tcId)) {
                        continue;
                    }
                    // For all other tax centers, strictly 2 Joint TLs and 10 Joint Auditors
                    for (int tl = 1; tl <= 2; tl++) {
                        String tlId = "u-tl-" + tcId + "-joint-" + tl;
                        String tlTitle = "Joint TL-" + tl + " (" + tcShort + ")";
                        addUser(tlId, tlId, tlId + "@mor.gov.et",
                                tlTitle, "TEAM_LEADER", "JOINT_AUDIT", "TAX_CENTER", tcId);
                    }
                    for (int a = 1; a <= 10; a++) {
                        String audId = "u-aud-" + tcId + "-joint-" + a;
                        String audTitle = "Joint Aud-" + a + " (" + tcShort + ")";
                        addUser(audId, audId, audId + "@mor.gov.et",
                                audTitle, "AUDITOR", "JOINT_AUDIT", "TAX_CENTER", tcId);
                    }
                    continue;
                }

                // 2 Team Leaders per audit type (for non-joint audit types)
                for (int tl = 1; tl <= 2; tl++) {
                    String tlId = "u-tl-" + tcId + "-" + atShort.toLowerCase() + "-" + tl;
                    String tlTitle = atShort + " TL-" + tl + " (" + tcShort + ")";
                    addUser(tlId, tlId, tlId + "@mor.gov.et",
                            tlTitle, "TEAM_LEADER", auditType, "TAX_CENTER", tcId);

                    // 2 Auditors per Team Leader
                    for (int a = 1; a <= 2; a++) {
                        String audId = "u-aud-" + tcId + "-" + atShort.toLowerCase() + "-" + tl + "-" + a;
                        String audTitle = atShort + " Aud-" + a + " (TL-" + tl + ", " + tcShort + ")";
                        addUser(audId, audId, audId + "@mor.gov.et",
                                audTitle, "AUDITOR", auditType, "TAX_CENTER", tcId);
                    }
                }
            }
        }

        // ── System Administrator (National IT & Security Administration) ──
        addUser("00000000-0000-0000-0000-000000000001", "sys.admin", "admin@mor.gov.et",
                "Dawit Solomon", "SYSTEM_ADMIN", null, "NATIONAL", "FEDERAL");
        Map<String, Object> sysAdmin = USERS.get("00000000-0000-0000-0000-000000000001");
        if (sysAdmin != null) {
            sysAdmin.put("email", "admin@mor.gov.et");
            sysAdmin.put("legacyUsername", "admin");
            sysAdmin.put("legacyEmail", "admin@mor.gov.et");
            USER_LOOKUP.put("admin", sysAdmin);
            USER_LOOKUP.put("sys.admin", sysAdmin);
            USER_LOOKUP.put("sys-admin", sysAdmin);
            USER_LOOKUP.put("admin@mor.gov.et", sysAdmin);
            USER_LOOKUP.put("sys.admin@mor.gov.et", sysAdmin);
        }
    }

    // ───────── User builder ─────────

    private static boolean isGenericRoleTitle(String str) {
        if (str == null || str.isBlank()) return true;
        String s = str.trim().toLowerCase();
        return s.startsWith("planning team")
            || s.equals("director")
            || s.equals("deputy director")
            || s.startsWith("senior manager")
            || s.startsWith("federal joint committee")
            || s.startsWith("federal tp committee")
            || s.startsWith("federal desk audit committee")
            || s.startsWith("federal comprehensive audit committee")
            || s.startsWith("federal issue audit committee")
            || s.startsWith("tp committee chair")
            || s.startsWith("tax center manager")
            || s.startsWith("joint committee chair")
            || s.startsWith("ministry of trade")
            || s.matches(".*\\baa\\d+\\s+auditor\\s+\\d+.*")
            || s.matches(".*\\b(joint|desk|tp|comp|issue)\\s+tl-\\d+.*")
            || s.matches(".*\\b(joint|desk|tp|comp|issue)\\s+aud-\\d+.*");
    }

    public static String getRolePrefix(String userType) {
        if (userType == null) return "officer";
        switch (userType.toUpperCase()) {
            case "SYSTEM_ADMIN": return "sysadmin";
            case "DIRECTOR": return "director";
            case "PLANNING_TEAM": return "planning";
            case "SENIOR_MANAGEMENT": return "seniormanagement";
            case "REGIONAL_DIRECTOR": return "regionaldirector";
            case "TAX_CENTER_MANAGER": return "taxcentermanager";
            case "COMMITTEE_CHAIR": return "committeechair";
            case "COMMITTEE_MEMBER": return "committeemember";
            case "TEAM_LEADER": return "teamleader";
            case "AUDITOR": return "auditor";
            case "AUDIT_REQUESTER": return "auditrequester";
            default: return userType.toLowerCase().replace("_", "");
        }
    }

    public static String toPrefixedUsername(String rawUsername, String userType) {
        if (rawUsername == null || rawUsername.isBlank()) return "user";
        String u = rawUsername.trim();
        if ("sys.admin".equalsIgnoreCase(u) || "admin".equalsIgnoreCase(u) || "SYSTEM_ADMIN".equalsIgnoreCase(userType)) {
            return "sysadmin-01";
        }
        String prefix = getRolePrefix(userType);

        if (u.startsWith(prefix + "-")) return u;
        if (u.startsWith("u-pt-")) return u.replace("u-pt-", "planning-");
        if (u.startsWith("u-ad-")) return u.replace("u-ad-", "director-");
        if (u.startsWith("u-sm-")) return u.replace("u-sm-", "seniormanagement-");
        if (u.startsWith("u-rd-")) return u.replace("u-rd-", "regionaldirector-");
        if (u.startsWith("u-tcm-")) return u.replace("u-tcm-", "taxcentermanager-");
        if (u.startsWith("u-tl-")) return u.replace("u-tl-", "teamleader-");
        if (u.startsWith("u-aud-")) return u.replace("u-aud-", "auditor-");
        if (u.startsWith("u-req-")) return u.replace("u-req-", "auditrequester-");
        if (u.startsWith("u-com-")) {
            return u.replace("u-com-", "committee-");
        }

        if ("fed.ja.chair".equals(u)) return "committeechair-federal-lto1-ja";
        if ("fed.ja.member".equals(u)) return "committeemember-federal-lto1-ja";
        if ("fed.ja.tl".equals(u)) return "teamleader-federal-lto1-ja-1";
        if ("fed.ja.tl2".equals(u)) return "teamleader-federal-lto1-ja-2";
        if (u.startsWith("fed.ja.auditor")) return u.replace("fed.ja.auditor", "auditor-federal-lto1-ja-");

        if ("fed2.ja.chair".equals(u)) return "committeechair-federal-lto2-ja";
        if ("fed2.ja.member".equals(u)) return "committeemember-federal-lto2-ja";
        if ("fed2.ja.tl".equals(u)) return "teamleader-federal-lto2-ja-1";
        if ("fed2.ja.tl2".equals(u)) return "teamleader-federal-lto2-ja-2";
        if (u.startsWith("fed2.ja.auditor")) return u.replace("fed2.ja.auditor", "auditor-federal-lto2-ja-");

        if (u.matches("^[a-z]{2}\\d+\\.chair$")) return "committeechair-" + u.replace(".chair", "");
        if (u.matches("^[a-z]{2}\\d+\\.member$")) return "committeemember-" + u.replace(".member", "");
        if (u.matches("^[a-z]{2}\\d+\\.tl\\d*$")) {
            String base = u.replaceAll("\\.tl.*", "");
            String num = u.contains(".tl2") ? "2" : "1";
            return "teamleader-" + base + "-" + num;
        }
        if (u.matches("^[a-z]{2}\\d+\\.auditor\\d+$")) {
            String base = u.replaceAll("\\.auditor.*", "");
            String num = u.replaceAll(".*\\.auditor", "");
            return "auditor-" + base + "-" + num;
        }

        return prefix + "-" + u;
    }

    private static void addUser(String userId, String username, String email, String title,
                                String userType, String auditType, String level, String location) {

        boolean isGenericRole = isGenericRoleTitle(title);

        String fullName;
        String jobTitle;

        if (!isGenericRole) {
            // Explicit human name passed (e.g. "Fikremariam Tilahun", "Dr. Solomon Desta", "Solomon Worku (Federal LTO)")
            fullName = title;
            if ("fed.ja.auditor1".equals(username)) {
                jobTitle = "Joint Auditor (Customs)";
            } else if ("AUDITOR".equals(userType)) {
                jobTitle = (auditType != null ? auditType.replace("_", " ") + " " : "") + "Auditor";
            } else if ("TEAM_LEADER".equals(userType)) {
                jobTitle = (auditType != null ? auditType.replace("_", " ") + " " : "") + "Team Leader";
            } else if ("COMMITTEE_CHAIR".equals(userType)) {
                jobTitle = (auditType != null ? auditType.replace("_", " ") + " " : "") + "Committee Chair";
            } else if ("COMMITTEE_MEMBER".equals(userType)) {
                jobTitle = (auditType != null ? auditType.replace("_", " ") + " " : "") + "Committee Member";
            } else if ("REGIONAL_DIRECTOR".equals(userType)) {
                jobTitle = "Regional Director";
            } else {
                jobTitle = userType != null ? userType.replace("_", " ") : "Officer";
            }
        } else {
            jobTitle = title;
            String firstName = FIRST_NAMES[Math.abs(userId.hashCode()) % FIRST_NAMES.length];
            String lastName  = LAST_NAMES[Math.abs(username.hashCode()) % LAST_NAMES.length];
            fullName = firstName + " " + lastName;
        }

        String rolePrefix = getRolePrefix(userType);
        String prefixedUsername = toPrefixedUsername(username, userType);

        String cleanName = fullName.replace("Dr. ", "").replace("Dr.", "").replaceAll("\\s*\\([^)]*\\)", "").trim();
        String[] parts = cleanName.split("\\s+");
        String realisticEmail;
        String baseNamePart = (parts.length >= 2 ? (parts[0].toLowerCase() + "." + parts[parts.length - 1].toLowerCase()) : prefixedUsername.toLowerCase().replace("-", ".")).replaceAll("[^a-z0-9.]", "");
        String candidate = rolePrefix + "." + baseNamePart;
        String baseEmail = candidate + "@mor.gov.et";
        if (!ASSIGNED_EMAILS.contains(baseEmail)) {
            realisticEmail = baseEmail;
        } else {
            int seq = 2;
            while (ASSIGNED_EMAILS.contains(candidate + seq + "@mor.gov.et")) {
                seq++;
            }
            realisticEmail = candidate + seq + "@mor.gov.et";
        }
        ASSIGNED_EMAILS.add(realisticEmail);

        String department = "Tax Audit";
        if (auditType != null) {
            switch (auditType) {
                case "DESK_AUDIT":          department = "Desk Audit";         break;
                case "JOINT_AUDIT":         department = "Joint Audit";        break;
                case "TRANSFER_PRICING":    department = "Transfer Pricing";   break;
                case "COMPREHENSIVE_AUDIT": department = "Comprehensive Audit";break;
                case "ISSUE_AUDIT":         department = "Issue Audit";        break;
                default:                    department = auditType;            break;
            }
        }

        Map<String, Object> user = new LinkedHashMap<>();
        user.put("userId",           userId);
        user.put("username",         prefixedUsername);
        user.put("legacyUsername",   username);
        user.put("email",            realisticEmail);
        user.put("legacyEmail",      baseNamePart + "@mor.gov.et");
        user.put("fullName",         fullName);
        user.put("jobTitle",         jobTitle);
        user.put("department",       department);
        user.put("officeLocation",   location);
        user.put("userType",         userType);
        user.put("auditType",        auditType);
        user.put("assignedLevel",    level);
        user.put("assignedLocation", location);
        user.put("employeeId",       "MOR-" + (employeeCounter++));
        user.put("status",           "ACTIVE");
        user.put("supervisorId",     "director-01");

        List<String> roles = new ArrayList<>(Arrays.asList("ROLE_USER"));
        roles.add("ROLE_" + userType);
        user.put("roles", roles);

        USERS.put(userId, user);
        USER_LOOKUP.put(userId.toLowerCase(), user);
        USER_LOOKUP.put(prefixedUsername.toLowerCase(), user);
        if (username != null) {
            USER_LOOKUP.put(username.toLowerCase(), user);
        }
        USER_LOOKUP.put(realisticEmail.toLowerCase(), user);
        USER_LOOKUP.put(baseNamePart.toLowerCase() + "@mor.gov.et", user);
    }

    // ───────── Port interface ─────────

    @Override
    public String getUserRole(String userId) {
        if (userId == null) return "ROLE_USER";
        Map<String, Object> user = USER_LOOKUP.get(userId.toLowerCase());
        if (user == null) user = USERS.get(userId);
        if (user == null) return "ROLE_USER";
        return (String) user.get("userType");
    }

    @Override
    public String getUserTaxCenter(String userId) {
        if (userId == null) return null;
        Map<String, Object> user = USER_LOOKUP.get(userId.toLowerCase());
        if (user == null) user = USERS.get(userId);
        if (user == null) return null;
        return (String) user.get("assignedLocation");
    }

    @Override
    public List<Map<String, Object>> getTeamLeaders(String taxCenterCode, String auditType) {
        return USERS.values().stream()
            .filter(u -> "TEAM_LEADER".equals(u.get("userType")))
            .filter(u -> taxCenterCode == null || taxCenterCode.equalsIgnoreCase((String) u.get("assignedLocation")))
            .filter(u -> auditType == null || auditType.equalsIgnoreCase((String) u.get("auditType")))
            .collect(Collectors.toList());
    }

    @Override
    public List<Map<String, Object>> getCommitteeMembers(String auditType) {
        return USERS.values().stream()
            .filter(u -> "COMMITTEE_MEMBER".equals(u.get("userType")) || "AUDITOR".equals(u.get("userType")))
            .filter(u -> auditType == null || auditType.equalsIgnoreCase((String) u.get("auditType")))
            .collect(Collectors.toList());
    }

    @Override
    public Map<String, Object> getUserById(String userId) {
        if (userId == null) return null;
        Map<String, Object> user = USER_LOOKUP.get(userId.toLowerCase());
        if (user != null) return user;
        return USERS.get(userId);
    }

    public Optional<Map<String, Object>> getUserProfile(String userId) {
        return Optional.ofNullable(getUserById(userId));
    }

    /** Used by MockDataSeeder to seed all users into the AP UserRepository / DB. */
    public List<Map<String, Object>> getAllUsers() {
        return new ArrayList<>(USERS.values());
    }

    public List<Map<String, Object>> findUsersByCriteria(Map<String, Object> criteria) {
        return USERS.values().stream()
                .filter(u -> matchesCriteria(u, criteria))
                .collect(Collectors.toList());
    }

    private boolean matchesCriteria(Map<String, Object> user, Map<String, Object> criteria) {
        for (Map.Entry<String, Object> entry : criteria.entrySet()) {
            if (entry.getValue() == null) continue;

            Object userValue = user.get(entry.getKey());

            // Special handling: "region" matches both REGIONAL location (code) and TAX_CENTER prefix
            if ("region".equals(entry.getKey())) {
                String region = (String) entry.getValue();
                if ("REGIONAL".equals(user.get("assignedLevel"))) {
                    if (!region.equalsIgnoreCase((String) user.get("assignedLocation"))) return false;
                } else if ("TAX_CENTER".equals(user.get("assignedLevel"))) {
                    String loc = (String) user.get("assignedLocation");
                    // Frontend region-id based matching (e.g. addis_ababa → addis_ababa-tc1)
                    if (!loc.toUpperCase().startsWith(region.toUpperCase())) {
                        // Also try short code matching (AA → addis_ababa-tc1? No. So skip.)
                        return false;
                    }
                } else {
                    return false;
                }
                continue;
            }

            if (userValue == null || !userValue.toString().equalsIgnoreCase(entry.getValue().toString())) {
                return false;
            }
        }
        return true;
    }
}
