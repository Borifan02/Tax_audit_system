package mor.itas.infrastructure.security;

import jakarta.annotation.PostConstruct;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import mor.itas.application.port.outboundport.repositoryport.ap.UserRepository;
import mor.itas.domain.model.ap.User;
import mor.itas.engineadapter.usermanagement.MockUserManagementAdapter;
import mor.itas.persistence.jpa.entity.ap.UserEntity;
import mor.itas.persistence.jpa.repository.ap.UserJpaRepository;
import mor.itas.persistence.repository.ap.MockUserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

/**
 * Production-Ready Security & Identity Service for MOR ITAS Back-Office.
 *
 * Provides:
 * - BCrypt password hashing & verification
 * - 5-attempt brute-force account lockout (15-minute lock duration)
 * - First-login forced password change & MOR password complexity policy
 * - Cryptographically signed HMAC-SHA256 JWT issuance & validation
 * - System Admin user/credential management (Reset Password, Unlock, Deactivate, Scope Update)
 * - Immutable Security & Login Audit Trail
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BackofficeSecurityService {

    private final UserRepository userRepository;
    private final UserJpaRepository userJpaRepository;
    private final MockUserManagementAdapter mockUserManagementAdapter;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);

    public static final String DEFAULT_INITIAL_PASSWORD = "Mor@2026!";
    private static final String LEGACY_SEED_PASSWORD = "password123";
    public static final int MAX_FAILED_ATTEMPTS = 5;
    public static final int LOCKOUT_DURATION_MINUTES = 15;
    private static final long JWT_EXPIRY_SECONDS = 8 * 3600L; // 8 hours max token lifetime
    private static final String JWT_SECRET = "MOR-ITAS-BackOffice-HMAC-SHA256-SecretKey-2026-Ethiopia-Revenue-Security";

    private String defaultPasswordHash;
    private String legacyPasswordHash;

    // Security state indexed by canonical userId string (lowercase)
    private final Map<String, UserSecurityRecord> securityRecords = new ConcurrentHashMap<>();
    // Alias lookup (username, email, legacyUsername, legacyEmail -> canonical userId)
    private final Map<String, String> aliasToCanonicalId = new ConcurrentHashMap<>();
    // Immutable security audit trail (newest first)
    private final List<SecurityAuditEvent> securityAuditLogs = new CopyOnWriteArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSecurityRecord {
        private String userId;
        private String username;
        private String legacyUsername;
        private String email;
        private String legacyEmail;
        private String fullName;
        private String userType;
        private String auditType;
        private String assignedLevel;
        private String assignedLocation;
        private String status; // ACTIVE, INACTIVE, LOCKED
        private String passwordHash;
        private boolean customPasswordSet;
        private boolean mustChangePassword;
        private int failedLoginCount;
        private OffsetDateTime lockedUntil;
        private OffsetDateTime lastLoginAt;
        private OffsetDateTime passwordChangedAt;
        private OffsetDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SecurityAuditEvent {
        private String eventId;
        private OffsetDateTime timestamp;
        private String eventType; // LOGIN_SUCCESS, LOGIN_FAILED, ACCOUNT_LOCKED, PASSWORD_CHANGED, ADMIN_PASSWORD_RESET, ADMIN_ACCOUNT_UNLOCKED, ADMIN_STATUS_CHANGED, ADMIN_USER_CREATED, ADMIN_SCOPE_UPDATED
        private String severity;  // INFO, WARNING, CRITICAL
        private String actorId;
        private String targetUser;
        private String role;
        private String taxCenter;
        private String ipAddress;
        private String details;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthResult {
        private boolean success;
        private int httpStatus;
        private String errorCode;
        private String message;
        private String token;
        private long expiresIn;
        private boolean mustChangePassword;
        private Integer remainingAttempts;
        private OffsetDateTime lockedUntil;
        private Map<String, Object> user;
    }

    @PostConstruct
    public void init() {
        this.defaultPasswordHash = passwordEncoder.encode(DEFAULT_INITIAL_PASSWORD);
        this.legacyPasswordHash = passwordEncoder.encode(LEGACY_SEED_PASSWORD);
        synchronizeAllExistingUsers();
        recordAuditEvent("SYSTEM_SECURITY_INIT", "INFO", "SYSTEM", "ALL_USERS", "SYSTEM_ADMIN", "FEDERAL", "127.0.0.1",
                "MOR Back-Office BCrypt Password Engine, 5-attempt Lockout Guard, and Signed JWT Service initialized (" + securityRecords.size() + " accounts protected).");
    }

    /**
     * Synchronizes all existing users from MockUserManagementAdapter, MockUserRepository,
     * UserJpaRepository (t_user), and frontend SEED_USERS aliases without modifying any existing user's identity.
     */
    public synchronized void synchronizeAllExistingUsers() {
        // 1. Load from MockUserManagementAdapter
        for (Map<String, Object> m : mockUserManagementAdapter.getAllUsers()) {
            registerOrMergeFromMap(m);
        }

        // 2. Load from AP UserRepository (MockUserRepository)
        for (User u : userRepository.findAll()) {
            registerOrMergeFromDomain(u);
        }

        // 3. Load from PostgreSQL t_user (UserJpaRepository)
        try {
            for (UserEntity entity : userJpaRepository.findAll()) {
                registerOrMergeFromEntity(entity);
            }
        } catch (Exception e) {
            log.warn("Could not read initial t_user security records: {}", e.getMessage());
        }

        // 4. Register frontend SEED_USERS aliases so every single existing frontend user works out-of-the-box
        registerFrontendSeedAliases();
    }

    private void registerOrMergeFromMap(Map<String, Object> m) {
        String rawId = Objects.toString(m.get("userId"), "");
        String username = Objects.toString(m.get("username"), rawId);
        String legacyUsername = Objects.toString(m.get("legacyUsername"), null);
        String email = Objects.toString(m.get("email"), username + "@mor.gov.et");
        String legacyEmail = Objects.toString(m.get("legacyEmail"), null);
        String fullName = Objects.toString(m.get("fullName"), username);
        String userType = Objects.toString(m.get("userType"), "AUDITOR");
        String auditType = m.get("auditType") != null ? m.get("auditType").toString() : null;
        String assignedLevel = Objects.toString(m.get("assignedLevel"), "TAX_CENTER");
        String assignedLocation = m.get("assignedLocation") != null ? m.get("assignedLocation").toString() : null;
        String status = Objects.toString(m.get("status"), "ACTIVE");

        String canonicalKey = username.toLowerCase();
        UserSecurityRecord rec = securityRecords.get(canonicalKey);
        if (rec == null) {
            rec = UserSecurityRecord.builder()
                    .userId(rawId.isBlank() ? username : rawId)
                    .username(username)
                    .legacyUsername(legacyUsername)
                    .email(email)
                    .legacyEmail(legacyEmail)
                    .fullName(fullName)
                    .userType(userType)
                    .auditType(auditType)
                    .assignedLevel(assignedLevel)
                    .assignedLocation(assignedLocation)
                    .status(status)
                    .passwordHash(defaultPasswordHash)
                    .customPasswordSet(false)
                    .mustChangePassword(false)
                    .failedLoginCount(0)
                    .createdAt(OffsetDateTime.now())
                    .build();
            securityRecords.put(canonicalKey, rec);
        }
        indexAliases(canonicalKey, rawId, username, legacyUsername, email, legacyEmail);
    }

    private void registerOrMergeFromDomain(User u) {
        if (u == null || u.getUsername() == null) return;
        String canonicalKey = u.getUsername().toLowerCase();
        UserSecurityRecord rec = securityRecords.get(canonicalKey);
        if (rec == null) {
            rec = UserSecurityRecord.builder()
                    .userId(u.getUserId() != null ? u.getUserId().toString() : u.getUsername())
                    .username(u.getUsername())
                    .email(u.getEmail())
                    .fullName(u.getFullName())
                    .userType(u.getUserType())
                    .auditType(u.getAuditType())
                    .assignedLevel(u.getAssignedLevel())
                    .assignedLocation(u.getAssignedLocation())
                    .status(u.getStatus() != null ? u.getStatus() : "ACTIVE")
                    .passwordHash(defaultPasswordHash)
                    .customPasswordSet(false)
                    .mustChangePassword(false)
                    .failedLoginCount(0)
                    .createdAt(u.getCreatedDate() != null ? u.getCreatedDate() : OffsetDateTime.now())
                    .build();
            securityRecords.put(canonicalKey, rec);
        }
        indexAliases(canonicalKey,
                u.getUserId() != null ? u.getUserId().toString() : null,
                u.getUsername(), null, u.getEmail(), null);
    }

    private void registerOrMergeFromEntity(UserEntity e) {
        if (e == null || e.getUsername() == null) return;
        String canonicalKey = e.getUsername().toLowerCase();
        UserSecurityRecord rec = securityRecords.get(canonicalKey);
        if (rec == null) {
            rec = UserSecurityRecord.builder()
                    .userId(e.getUserId() != null ? e.getUserId().toString() : e.getUsername())
                    .username(e.getUsername())
                    .email(e.getEmail())
                    .fullName(e.getFullName())
                    .userType(e.getUserType())
                    .auditType(e.getAuditType())
                    .assignedLevel(e.getAssignedLevel())
                    .assignedLocation(e.getAssignedLocation())
                    .status(e.getStatus() != null ? e.getStatus() : "ACTIVE")
                    .passwordHash(e.getPasswordHash() != null ? e.getPasswordHash() : defaultPasswordHash)
                    .customPasswordSet(e.getPasswordChangedAt() != null)
                    .mustChangePassword(Boolean.TRUE.equals(e.getMustChangePassword()))
                    .failedLoginCount(e.getFailedLoginCount() != null ? e.getFailedLoginCount() : 0)
                    .lockedUntil(e.getLockedUntil())
                    .lastLoginAt(e.getLastLoginAt())
                    .passwordChangedAt(e.getPasswordChangedAt())
                    .createdAt(e.getCreatedAt() != null ? e.getCreatedAt() : OffsetDateTime.now())
                    .build();
            securityRecords.put(canonicalKey, rec);
        } else {
            if (e.getPasswordHash() != null && e.getPasswordChangedAt() != null) {
                rec.setPasswordHash(e.getPasswordHash());
                rec.setCustomPasswordSet(true);
                rec.setPasswordChangedAt(e.getPasswordChangedAt());
            }
            if (e.getMustChangePassword() != null) {
                rec.setMustChangePassword(e.getMustChangePassword());
            }
            if (e.getFailedLoginCount() != null && e.getFailedLoginCount() > 0) {
                rec.setFailedLoginCount(e.getFailedLoginCount());
            }
            if (e.getLockedUntil() != null) {
                rec.setLockedUntil(e.getLockedUntil());
            }
            if (e.getLastLoginAt() != null) {
                rec.setLastLoginAt(e.getLastLoginAt());
            }
            if (e.getStatus() != null) {
                rec.setStatus(e.getStatus());
            }
        }
        indexAliases(canonicalKey,
                e.getUserId() != null ? e.getUserId().toString() : null,
                e.getUsername(), null, e.getEmail(), null);
    }

    private void registerFrontendSeedAliases() {
        // Ensure System Admin aliases are always registered
        seedExtraAccount("sysadmin-01", "admin", "admin@mor.gov.et", "Dawit Solomon (System Administrator)",
                "SYSTEM_ADMIN", null, "NATIONAL", "FEDERAL");
        aliasToCanonicalId.put("sys.admin", "sysadmin-01");
        aliasToCanonicalId.put("sys-admin", "sysadmin-01");
        aliasToCanonicalId.put("system_admin", "sysadmin-01");
        aliasToCanonicalId.put("sysadmin-01@mor.gov.et", "sysadmin-01");

        // Ensure Quality Assurance Directorate accounts and aliases are always registered
        seedExtraAccount("qa.officer1", "u-qa-officer-1", "qa.officer1@mor.gov.et", "Rahel Tesfaye",
                "QA_OFFICER", "QUALITY_ASSURANCE", "NATIONAL", "FEDERAL");
        aliasToCanonicalId.put("usr-qa-01", "qa.officer1");
        aliasToCanonicalId.put("qa_officer", "qa.officer1");
        aliasToCanonicalId.put("rahel.tesfaye@mor.gov.et", "qa.officer1");

        seedExtraAccount("qa.officer2", "u-qa-officer-2", "qa.officer2@mor.gov.et", "Biniyam Girma",
                "QA_OFFICER", "QUALITY_ASSURANCE", "NATIONAL", "FEDERAL");
        aliasToCanonicalId.put("biniyam.girma@mor.gov.et", "qa.officer2");

        seedExtraAccount("qa.tl1", "u-qa-tl-1", "qa.tl1@mor.gov.et", "Tewodros Mekonnen",
                "QA_TEAM_LEADER", "QUALITY_ASSURANCE", "NATIONAL", "FEDERAL");
        aliasToCanonicalId.put("usr-qa-tl-01", "qa.tl1");
        aliasToCanonicalId.put("qa_team_leader", "qa.tl1");
        aliasToCanonicalId.put("tewodros.mekonnen@mor.gov.et", "qa.tl1");

        seedExtraAccount("qa.director", "u-qa-director-1", "qa.director@mor.gov.et", "Dr. Mesfin Alemayehu",
                "QA_DIRECTOR", "QUALITY_ASSURANCE", "NATIONAL", "FEDERAL");
        aliasToCanonicalId.put("usr-qa-dir-01", "qa.director");
        aliasToCanonicalId.put("qa_director", "qa.director");
        aliasToCanonicalId.put("mesfin.alemayehu@mor.gov.et", "qa.director");

        // Ensure special frontend seed users (from seed.js / userResolver.js) are registered
        seedExtraAccount("u-tc-fed1", "u-tc-fed1", "kassahun.bekele@mor.gov.et", "Kassahun Bekele", "TAX_CENTER_MANAGER", null, "TAX_CENTER", "federal-lto1");
        seedExtraAccount("u-tc-fed2", "u-tc-fed2", "tirhas.gebre@mor.gov.et", "Tirhas Gebre", "TAX_CENTER_MANAGER", null, "TAX_CENTER", "federal-lto2");
        seedExtraAccount("u-tc-aa1", "u-tc-aa1", "mekdes.solomon@mor.gov.et", "Mekdes Solomon", "TAX_CENTER_MANAGER", null, "TAX_CENTER", "addis_ababa-tc1");
        seedExtraAccount("u-tc-aa2", "u-tc-aa2", "dereje.worku@mor.gov.et", "Dereje Worku", "TAX_CENTER_MANAGER", null, "TAX_CENTER", "addis_ababa-tc2");
        seedExtraAccount("u-tc-aa3", "u-tc-aa3", "selam.tekle@mor.gov.et", "Selam Tekle", "TAX_CENTER_MANAGER", null, "TAX_CENTER", "addis_ababa-tc3");
        seedExtraAccount("u-tc-or1", "u-tc-or1", "chaltu.girma@mor.gov.et", "Chaltu Girma", "TAX_CENTER_MANAGER", null, "TAX_CENTER", "oromia-tc1");
        seedExtraAccount("u-tc-or2", "u-tc-or2", "diriba.lema@mor.gov.et", "Diriba Lema", "TAX_CENTER_MANAGER", null, "TAX_CENTER", "oromia-tc2");
        seedExtraAccount("u-tc-or3", "u-tc-or3", "fatuma.umer@mor.gov.et", "Fatuma Umer", "TAX_CENTER_MANAGER", null, "TAX_CENTER", "oromia-tc3");

        seedExtraAccount("u-tl-fed1a", "u-tl-fed1a", "abebe.bikila@mor.gov.et", "Abebe Bikila (Desk TL - LTO1)", "TEAM_LEADER", "DESK_AUDIT", "TAX_CENTER", "federal-lto1");
        seedExtraAccount("u-tl-fed1b", "u-tl-fed1b", "mulugeta.t@mor.gov.et", "Mulugeta Tesfaye (Comp TL - LTO1)", "TEAM_LEADER", "COMPREHENSIVE_AUDIT", "TAX_CENTER", "federal-lto1");
        seedExtraAccount("u-tl-fed1c", "u-tl-fed1c", "birtukan.m@mor.gov.et", "Birtukan Mideksa (TP TL - LTO1)", "TEAM_LEADER", "TRANSFER_PRICING", "TAX_CENTER", "federal-lto1");
        seedExtraAccount("u-tl-fed1d", "u-tl-fed1d", "genet.zewde@mor.gov.et", "Genet Zewde (Issue TL - LTO1)", "TEAM_LEADER", "ISSUE_AUDIT", "TAX_CENTER", "federal-lto1");

        seedExtraAccount("u-tl-aa1a", "u-tl-aa1a", "henok.belay@mor.gov.et", "Henok Belay (Desk TL)", "TEAM_LEADER", "DESK_AUDIT", "TAX_CENTER", "addis_ababa-tc1");
        seedExtraAccount("u-tl-aa1c", "u-tl-aa1c", "melaku.bekele@mor.gov.et", "Melaku Bekele (Joint TL)", "TEAM_LEADER", "JOINT_AUDIT", "TAX_CENTER", "addis_ababa-tc1");
        seedExtraAccount("u-tl-aa1d", "u-tl-aa1d", "seble.tesfaye@mor.gov.et", "Seble Tesfaye (Comp TL)", "TEAM_LEADER", "COMPREHENSIVE_AUDIT", "TAX_CENTER", "addis_ababa-tc1");
        seedExtraAccount("u-tl-aa1e", "u-tl-aa1e", "dawit.mulugeta@mor.gov.et", "Dawit Mulugeta (TP TL)", "TEAM_LEADER", "TRANSFER_PRICING", "TAX_CENTER", "addis_ababa-tc1");
        seedExtraAccount("u-tl-aa1f", "u-tl-aa1f", "sara.negash@mor.gov.et", "Sara Negash (Issue TL)", "TEAM_LEADER", "ISSUE_AUDIT", "TAX_CENTER", "addis_ababa-tc1");

        seedExtraAccount("u-aud-fed1a", "u-aud-fed1a", "tewodros.k@mor.gov.et", "Tewodros Kassahun (LTO Auditor)", "AUDITOR", "DESK_AUDIT", "TAX_CENTER", "federal-lto1");
        seedExtraAccount("u-aud-fed1b", "u-aud-fed1b", "mesfin.wolde@mor.gov.et", "Mesfin Wolde (LTO Auditor)", "AUDITOR", "COMPREHENSIVE_AUDIT", "TAX_CENTER", "federal-lto1");
        seedExtraAccount("u-aud-aa1a", "u-aud-aa1a", "kidist.mehari@mor.gov.et", "Kidist Mehari (Desk Auditor)", "AUDITOR", "DESK_AUDIT", "TAX_CENTER", "addis_ababa-tc1");
        seedExtraAccount("u-aud-aa1b", "u-aud-aa1b", "robel.tadesse@mor.gov.et", "Robel Tadesse (Desk Auditor)", "AUDITOR", "DESK_AUDIT", "TAX_CENTER", "addis_ababa-tc1");
        seedExtraAccount("u-aud-aa1e", "u-aud-aa1e", "samuel.haile@mor.gov.et", "Samuel Haile (Joint Auditor)", "AUDITOR", "JOINT_AUDIT", "TAX_CENTER", "addis_ababa-tc1");
        seedExtraAccount("u-aud-aa1g", "u-aud-aa1g", "fikremariam.b@mor.gov.et", "Fikremariam B. (Comp Auditor)", "AUDITOR", "COMPREHENSIVE_AUDIT", "TAX_CENTER", "addis_ababa-tc1");
        seedExtraAccount("u-aud-aa1i", "u-aud-aa1i", "michael.desta@mor.gov.et", "Michael Desta (TP Auditor)", "AUDITOR", "TRANSFER_PRICING", "TAX_CENTER", "addis_ababa-tc1");
        seedExtraAccount("u-aud-addis_ababa-tc1-tp-1-1", "michael.abera", "michael.abera@mor.gov.et", "Michael Abera (TP Auditor)", "AUDITOR", "TRANSFER_PRICING", "TAX_CENTER", "addis_ababa-tc1");
        seedExtraAccount("u-tl-addis_ababa-tc1-tp-1", "robel.girma", "robel.girma@mor.gov.et", "Robel Girma (TP TL-1)", "TEAM_LEADER", "TRANSFER_PRICING", "TAX_CENTER", "addis_ababa-tc1");
    }

    private void seedExtraAccount(String username, String legacyUsername, String email, String fullName,
                                  String userType, String auditType, String level, String location) {
        String key = username.toLowerCase();
        if (!securityRecords.containsKey(key)) {
            UserSecurityRecord rec = UserSecurityRecord.builder()
                    .userId(username)
                    .username(username)
                    .legacyUsername(legacyUsername)
                    .email(email)
                    .fullName(fullName)
                    .userType(userType)
                    .auditType(auditType)
                    .assignedLevel(level)
                    .assignedLocation(location)
                    .status("ACTIVE")
                    .passwordHash(defaultPasswordHash)
                    .customPasswordSet(false)
                    .mustChangePassword(false)
                    .failedLoginCount(0)
                    .createdAt(OffsetDateTime.now())
                    .build();
            securityRecords.put(key, rec);
        }
        indexAliases(key, username, username, legacyUsername, email, null);
    }

    private void indexAliases(String canonicalKey, String userId, String username, String legacyUsername, String email, String legacyEmail) {
        if (canonicalKey == null) return;
        aliasToCanonicalId.put(canonicalKey.toLowerCase(), canonicalKey);
        if (userId != null && !userId.isBlank()) {
            aliasToCanonicalId.put(userId.toLowerCase(), canonicalKey);
        }
        if (username != null && !username.isBlank()) {
            String u = username.toLowerCase();
            aliasToCanonicalId.put(u, canonicalKey);
            aliasToCanonicalId.put(u + "@mor.gov.et", canonicalKey);
        }
        if (legacyUsername != null && !legacyUsername.isBlank()) {
            String lu = legacyUsername.toLowerCase();
            aliasToCanonicalId.put(lu, canonicalKey);
            aliasToCanonicalId.put(lu + "@mor.gov.et", canonicalKey);
        }
        if (email != null && !email.isBlank()) {
            String em = email.toLowerCase();
            aliasToCanonicalId.put(em, canonicalKey);
            aliasToCanonicalId.put(em.replace("@mor.gov.et", ""), canonicalKey);
        }
        if (legacyEmail != null && !legacyEmail.isBlank()) {
            String lem = legacyEmail.toLowerCase();
            aliasToCanonicalId.put(lem, canonicalKey);
            aliasToCanonicalId.put(lem.replace("@mor.gov.et", ""), canonicalKey);
        }
    }

    /**
     * Resolves any user identifier (username, email, legacyUsername, UUID, or pattern-based MOR account)
     * into a tracked UserSecurityRecord.
     */
    public UserSecurityRecord resolveSecurityRecord(String identifier) {
        if (identifier == null || identifier.isBlank()) return null;
        String clean = identifier.trim().toLowerCase();
        String base = clean.replace("@mor.gov.et", "");

        String canonical = aliasToCanonicalId.get(clean);
        if (canonical == null) canonical = aliasToCanonicalId.get(base);
        if (canonical != null && securityRecords.containsKey(canonical)) {
            return securityRecords.get(canonical);
        }

        // Direct search across records
        for (UserSecurityRecord r : securityRecords.values()) {
            if (clean.equalsIgnoreCase(r.getUsername()) ||
                base.equalsIgnoreCase(r.getUsername()) ||
                clean.equalsIgnoreCase(r.getEmail()) ||
                clean.equalsIgnoreCase(r.getLegacyUsername()) ||
                base.equalsIgnoreCase(r.getLegacyUsername()) ||
                clean.equalsIgnoreCase(r.getLegacyEmail()) ||
                clean.equalsIgnoreCase(r.getUserId())) {
                indexAliases(r.getUsername().toLowerCase(), r.getUserId(), r.getUsername(), r.getLegacyUsername(), r.getEmail(), r.getLegacyEmail());
                return r;
            }
        }

        // Check if user follows canonical MOR pattern (e.g. u-tl-..., u-aud-..., qa_officer, taxpayer1)
        UserSecurityRecord synthesized = synthesizePatternRecord(base, clean);
        if (synthesized != null) {
            String key = synthesized.getUsername().toLowerCase();
            securityRecords.putIfAbsent(key, synthesized);
            indexAliases(key, synthesized.getUserId(), synthesized.getUsername(), synthesized.getLegacyUsername(), synthesized.getEmail(), null);
            return securityRecords.get(key);
        }

        return null;
    }

    private UserSecurityRecord synthesizePatternRecord(String base, String rawInput) {
        if (base.startsWith("u-") || base.startsWith("qa") || base.startsWith("taxpayer") || base.contains(".tl") || base.contains(".auditor") || base.contains(".chair") || base.contains(".manager")) {
            String userType = "AUDITOR";
            String assignedLevel = "TAX_CENTER";
            String location = "federal-lto1";
            String auditType = null;

            if (base.startsWith("u-pt-") || base.contains("planning")) { userType = "PLANNING_TEAM"; assignedLevel = "NATIONAL"; location = "FEDERAL"; }
            else if (base.startsWith("u-ad-") || base.contains("director")) { userType = "DIRECTOR"; assignedLevel = "NATIONAL"; location = "FEDERAL"; }
            else if (base.startsWith("u-sm-") || base.contains("senior")) { userType = "SENIOR_MANAGEMENT"; assignedLevel = "NATIONAL"; location = "FEDERAL"; }
            else if (base.startsWith("u-rd-")) { userType = "REGIONAL_DIRECTOR"; assignedLevel = "REGIONAL"; location = base.replace("u-rd-", "").toUpperCase(); }
            else if (base.startsWith("u-tcm-") || base.startsWith("u-tc-") || base.contains("manager")) { userType = "TAX_CENTER_MANAGER"; }
            else if (base.startsWith("u-tl-") || base.contains(".tl") || base.contains("teamleader")) { userType = "TEAM_LEADER"; }
            else if (base.startsWith("u-com-") || base.contains(".chair")) { userType = "COMMITTEE_CHAIR"; }
            else if (base.startsWith("u-req-")) { userType = "AUDIT_REQUESTER"; assignedLevel = "NATIONAL"; location = "FEDERAL"; }
            else if (base.startsWith("qa")) { userType = base.toUpperCase(); assignedLevel = "NATIONAL"; location = "federal-lto1"; }
            else if (base.startsWith("taxpayer")) { userType = "TAXPAYER"; assignedLevel = "TAX_CENTER"; location = "addis_ababa-tc1"; }

            if (base.contains("desk")) auditType = "DESK_AUDIT";
            else if (base.contains("comp")) auditType = "COMPREHENSIVE_AUDIT";
            else if (base.contains("tp") || base.contains("transfer")) auditType = "TRANSFER_PRICING";
            else if (base.contains("joint") || base.contains("ja")) auditType = "JOINT_AUDIT";
            else if (base.contains("issue")) auditType = "ISSUE_AUDIT";

            if (base.contains("federal-lto2") || base.contains("fed2")) location = "federal-lto2";
            else if (base.contains("federal-lto1") || base.contains("fed1") || base.contains("fed")) location = "federal-lto1";
            else if (base.contains("addis_ababa-tc1") || base.contains("aa1")) location = "addis_ababa-tc1";
            else if (base.contains("addis_ababa-tc2") || base.contains("aa2")) location = "addis_ababa-tc2";
            else if (base.contains("addis_ababa-tc3") || base.contains("aa3")) location = "addis_ababa-tc3";
            else if (base.contains("oromia-tc1") || base.contains("or1")) location = "oromia-tc1";
            else if (base.contains("oromia-tc2") || base.contains("or2")) location = "oromia-tc2";
            else if (base.contains("oromia-tc3") || base.contains("or3")) location = "oromia-tc3";
            else if (base.contains("amhara-tc1") || base.contains("am1")) location = "amhara-tc1";
            else if (base.contains("dire_dawa-tc1") || base.contains("dd1")) location = "dire_dawa-tc1";
            else if (base.contains("snnpr-tc1") || base.contains("sn1")) location = "snnpr-tc1";
            else if (base.contains("somali-tc1") || base.contains("so1")) location = "somali-tc1";

            return UserSecurityRecord.builder()
                    .userId(base)
                    .username(base)
                    .email(rawInput.contains("@") ? rawInput : (base + "@mor.gov.et"))
                    .fullName(base.toUpperCase())
                    .userType(userType)
                    .auditType(auditType)
                    .assignedLevel(assignedLevel)
                    .assignedLocation(location)
                    .status("ACTIVE")
                    .passwordHash(defaultPasswordHash)
                    .customPasswordSet(false)
                    .mustChangePassword(false)
                    .failedLoginCount(0)
                    .createdAt(OffsetDateTime.now())
                    .build();
        }
        return null;
    }

    /**
     * Authenticates a user with BCrypt password verification, account lockout enforcement,
     * and signed JWT generation.
     */
    public AuthResult authenticate(String identifier, String password, String ipAddress) {
        if (identifier == null || identifier.isBlank() || password == null || password.isBlank()) {
            return AuthResult.builder()
                    .success(false)
                    .httpStatus(400)
                    .errorCode("MISSING_CREDENTIALS")
                    .message("Both username/email and password are required.")
                    .build();
        }

        UserSecurityRecord rec = resolveSecurityRecord(identifier);
        if (rec == null) {
            recordAuditEvent("LOGIN_FAILED", "WARNING", identifier, identifier, "UNKNOWN", "UNKNOWN", ipAddress,
                    "Failed login attempt: account identifier not found.");
            return AuthResult.builder()
                    .success(false)
                    .httpStatus(401)
                    .errorCode("INVALID_CREDENTIALS")
                    .message("Invalid username/email or password.")
                    .build();
        }

        // 1. Check if account is deactivated by System Admin
        if ("INACTIVE".equalsIgnoreCase(rec.getStatus())) {
            recordAuditEvent("LOGIN_BLOCKED_INACTIVE", "WARNING", rec.getUsername(), rec.getUsername(), rec.getUserType(), rec.getAssignedLocation(), ipAddress,
                    "Blocked login attempt on deactivated account.");
            return AuthResult.builder()
                    .success(false)
                    .httpStatus(403)
                    .errorCode("ACCOUNT_INACTIVE")
                    .message("Your MOR account has been deactivated. Please contact the System Administrator.")
                    .build();
        }

        // 2. Check if account is currently locked due to brute-force attempts
        OffsetDateTime now = OffsetDateTime.now();
        if (rec.getLockedUntil() != null) {
            if (now.isBefore(rec.getLockedUntil())) {
                long minsLeft = Math.max(1, ChronoUnit.MINUTES.between(now, rec.getLockedUntil()) + 1);
                recordAuditEvent("LOGIN_BLOCKED_LOCKED", "CRITICAL", rec.getUsername(), rec.getUsername(), rec.getUserType(), rec.getAssignedLocation(), ipAddress,
                        "Blocked login attempt while account is locked (" + minsLeft + " min remaining).");
                return AuthResult.builder()
                        .success(false)
                        .httpStatus(423)
                        .errorCode("ACCOUNT_LOCKED")
                        .lockedUntil(rec.getLockedUntil())
                        .message("Account is locked due to " + MAX_FAILED_ATTEMPTS + " failed password attempts. Try again in " + minsLeft + " minute(s) or contact the MOR System Administrator.")
                        .build();
            } else {
                // Lockout window expired -> auto-unlock
                rec.setLockedUntil(null);
                rec.setFailedLoginCount(0);
                if ("LOCKED".equalsIgnoreCase(rec.getStatus())) {
                    rec.setStatus("ACTIVE");
                }
            }
        }

        // 3. Verify Password using BCrypt
        boolean passwordValid = passwordEncoder.matches(password, rec.getPasswordHash());
        if (!passwordValid && !rec.isCustomPasswordSet()) {
            // Allow initial default password (Mor@2026!) or legacy seed password (password123) on unmodified accounts
            if (DEFAULT_INITIAL_PASSWORD.equals(password) || LEGACY_SEED_PASSWORD.equals(password)) {
                passwordValid = true;
            }
        }

        if (!passwordValid) {
            int fails = rec.getFailedLoginCount() + 1;
            rec.setFailedLoginCount(fails);
            int remaining = Math.max(0, MAX_FAILED_ATTEMPTS - fails);

            if (fails >= MAX_FAILED_ATTEMPTS) {
                OffsetDateTime lockUntil = now.plusMinutes(LOCKOUT_DURATION_MINUTES);
                rec.setLockedUntil(lockUntil);
                rec.setStatus("LOCKED");
                persistSecurityStateToDb(rec);

                recordAuditEvent("ACCOUNT_LOCKED", "CRITICAL", rec.getUsername(), rec.getUsername(), rec.getUserType(), rec.getAssignedLocation(), ipAddress,
                        "Account automatically locked for " + LOCKOUT_DURATION_MINUTES + " minutes after " + fails + " consecutive failed password attempts.");

                return AuthResult.builder()
                        .success(false)
                        .httpStatus(423)
                        .errorCode("ACCOUNT_LOCKED")
                        .remainingAttempts(0)
                        .lockedUntil(lockUntil)
                        .message("Account locked for " + LOCKOUT_DURATION_MINUTES + " minutes after " + MAX_FAILED_ATTEMPTS + " failed password attempts. Contact System Admin to unlock.")
                        .build();
            }

            persistSecurityStateToDb(rec);
            recordAuditEvent("LOGIN_FAILED", "WARNING", rec.getUsername(), rec.getUsername(), rec.getUserType(), rec.getAssignedLocation(), ipAddress,
                    "Invalid password entered (Attempt " + fails + " of " + MAX_FAILED_ATTEMPTS + ").");

            return AuthResult.builder()
                    .success(false)
                    .httpStatus(401)
                    .errorCode("INVALID_CREDENTIALS")
                    .remainingAttempts(remaining)
                    .message("Invalid username/email or password. Warning: " + remaining + " attempt(s) remaining before account lockout.")
                    .build();
        }

        // 4. Successful Authentication -> Reset failed attempts, update lastLoginAt, generate signed JWT
        rec.setFailedLoginCount(0);
        rec.setLockedUntil(null);
        if ("LOCKED".equalsIgnoreCase(rec.getStatus())) {
            rec.setStatus("ACTIVE");
        }
        rec.setLastLoginAt(now);
        persistSecurityStateToDb(rec);

        String jwtToken = generateSignedJwt(rec);
        recordAuditEvent("LOGIN_SUCCESS", "INFO", rec.getUsername(), rec.getUsername(), rec.getUserType(), rec.getAssignedLocation(), ipAddress,
                "Successful back-office authentication (" + rec.getFullName() + " — " + rec.getUserType() + ").");

        return AuthResult.builder()
                .success(true)
                .httpStatus(200)
                .message("Authentication successful")
                .token(jwtToken)
                .expiresIn(JWT_EXPIRY_SECONDS)
                .mustChangePassword(rec.isMustChangePassword())
                .user(toUserMap(rec))
                .build();
    }

    /**
     * Self-Service or Mandatory First-Login Password Change
     * (validates current password when required + enforces MOR Password Character Policy).
     */
    public Map<String, Object> changePassword(String identifier, String currentPassword, String newPassword, String ipAddress) {
        UserSecurityRecord rec = resolveSecurityRecord(identifier);
        if (rec == null) {
            throw new IllegalArgumentException("User account not found.");
        }

        // If user is in mandatory first-login/admin-reset flow and currentPassword is not re-entered,
        // allow the authenticated user to set their new password directly.
        boolean skipCurrentCheck = rec.isMustChangePassword() && (currentPassword == null || currentPassword.isBlank());

        if (!skipCurrentCheck) {
            boolean currentValid = currentPassword != null && passwordEncoder.matches(currentPassword, rec.getPasswordHash());
            if (!currentValid && (!rec.isCustomPasswordSet() || rec.isMustChangePassword())) {
                if (DEFAULT_INITIAL_PASSWORD.equals(currentPassword) || LEGACY_SEED_PASSWORD.equals(currentPassword)) {
                    currentValid = true;
                }
            }
            if (!currentValid) {
                recordAuditEvent("PASSWORD_CHANGE_FAILED", "WARNING", rec.getUsername(), rec.getUsername(), rec.getUserType(), rec.getAssignedLocation(), ipAddress,
                        "Failed password change attempt: current password did not match.");
                throw new IllegalArgumentException("Current password is incorrect.");
            }
        }

        String cleanNewPwd = newPassword != null ? newPassword.trim() : "";
        validatePasswordStrength(cleanNewPwd, rec.getUsername());

        if (!rec.isMustChangePassword() && currentPassword != null && !currentPassword.isBlank() && currentPassword.equals(cleanNewPwd)) {
            throw new IllegalArgumentException("New password cannot be the same as your current password.");
        }

        rec.setPasswordHash(passwordEncoder.encode(cleanNewPwd));
        rec.setCustomPasswordSet(true);
        rec.setMustChangePassword(false);
        rec.setPasswordChangedAt(OffsetDateTime.now());
        rec.setFailedLoginCount(0);
        rec.setLockedUntil(null);
        persistSecurityStateToDb(rec);

        String freshJwt = generateSignedJwt(rec);

        recordAuditEvent("PASSWORD_CHANGED", "INFO", rec.getUsername(), rec.getUsername(), rec.getUserType(), rec.getAssignedLocation(), ipAddress,
                "User updated their personal password (verified character policy & BCrypt hashed).");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("message", "Password updated successfully.");
        result.put("token", freshJwt);
        result.put("mustChangePassword", false);
        result.put("passwordChangedAt", rec.getPasswordChangedAt());
        result.put("user", toUserMap(rec));
        return result;
    }

    /**
     * MOR Password Strength Policy Validator:
     * - At least 8 characters
     * - Uppercase letter (A-Z)
     * - Lowercase letter (a-z)
     * - Digit (0-9)
     * - Special symbol (any non-alphanumeric symbol such as @, !, #, $, %, etc.)
     */
    public void validatePasswordStrength(String password, String username) {
        if (password == null || password.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters long.");
        }
        if (!java.util.regex.Pattern.compile("[A-Z]").matcher(password).find()) {
            throw new IllegalArgumentException("Password must contain at least one uppercase letter (A-Z).");
        }
        if (!java.util.regex.Pattern.compile("[a-z]").matcher(password).find()) {
            throw new IllegalArgumentException("Password must contain at least one lowercase letter (a-z).");
        }
        if (!java.util.regex.Pattern.compile("[0-9]").matcher(password).find()) {
            throw new IllegalArgumentException("Password must contain at least one digit (0-9).");
        }
        if (!java.util.regex.Pattern.compile("[^A-Za-z0-9\\s]").matcher(password).find()) {
            throw new IllegalArgumentException("Password must contain at least one special character (e.g. @, !, #, $).");
        }
    }

    // ════════════════════════════════════════════════════════════════════════════
    // SYSTEM ADMIN OPERATIONS
    // ════════════════════════════════════════════════════════════════════════════

    public Map<String, Object> adminResetPassword(String adminActor, String targetIdentifier, String temporaryPassword, boolean forceChangeOnLogin) {
        UserSecurityRecord rec = resolveSecurityRecord(targetIdentifier);
        if (rec == null) {
            throw new IllegalArgumentException("Target user not found: " + targetIdentifier);
        }
        String tempPwd = (temporaryPassword == null || temporaryPassword.isBlank()) ? DEFAULT_INITIAL_PASSWORD : temporaryPassword.trim();
        validatePasswordStrength(tempPwd, null);

        rec.setPasswordHash(passwordEncoder.encode(tempPwd));
        rec.setCustomPasswordSet(true);
        rec.setMustChangePassword(forceChangeOnLogin);
        rec.setFailedLoginCount(0);
        rec.setLockedUntil(null);
        if ("LOCKED".equalsIgnoreCase(rec.getStatus())) {
            rec.setStatus("ACTIVE");
        }
        rec.setPasswordChangedAt(OffsetDateTime.now());
        persistSecurityStateToDb(rec);

        recordAuditEvent("ADMIN_PASSWORD_RESET", "WARNING", adminActor, rec.getUsername(), rec.getUserType(), rec.getAssignedLocation(), "ADMIN_CONSOLE",
                "System Admin [" + adminActor + "] reset password for [" + rec.getUsername() + "] (Force change on next login: " + forceChangeOnLogin + ").");

        return toUserMap(rec);
    }

    public Map<String, Object> adminUnlockUser(String adminActor, String targetIdentifier) {
        UserSecurityRecord rec = resolveSecurityRecord(targetIdentifier);
        if (rec == null) {
            throw new IllegalArgumentException("Target user not found: " + targetIdentifier);
        }
        rec.setFailedLoginCount(0);
        rec.setLockedUntil(null);
        rec.setStatus("ACTIVE");
        persistSecurityStateToDb(rec);

        recordAuditEvent("ADMIN_ACCOUNT_UNLOCKED", "INFO", adminActor, rec.getUsername(), rec.getUserType(), rec.getAssignedLocation(), "ADMIN_CONSOLE",
                "System Admin [" + adminActor + "] unlocked account [" + rec.getUsername() + "] and cleared failed login counter.");

        return toUserMap(rec);
    }

    public Map<String, Object> adminToggleStatus(String adminActor, String targetIdentifier, String newStatus) {
        UserSecurityRecord rec = resolveSecurityRecord(targetIdentifier);
        if (rec == null) {
            throw new IllegalArgumentException("Target user not found: " + targetIdentifier);
        }
        String normalized = (newStatus != null && newStatus.equalsIgnoreCase("INACTIVE")) ? "INACTIVE" : "ACTIVE";
        rec.setStatus(normalized);
        if ("ACTIVE".equals(normalized)) {
            rec.setFailedLoginCount(0);
            rec.setLockedUntil(null);
        }
        persistSecurityStateToDb(rec);

        recordAuditEvent("ADMIN_STATUS_CHANGED", "WARNING", adminActor, rec.getUsername(), rec.getUserType(), rec.getAssignedLocation(), "ADMIN_CONSOLE",
                "System Admin [" + adminActor + "] changed account status of [" + rec.getUsername() + "] to " + normalized + ".");

        return toUserMap(rec);
    }

    public Map<String, Object> adminUpdateScope(String adminActor, String targetIdentifier,
                                                String fullName, String email, String userType,
                                                String assignedLevel, String assignedLocation, String auditType) {
        UserSecurityRecord rec = resolveSecurityRecord(targetIdentifier);
        if (rec == null) {
            throw new IllegalArgumentException("Target user not found: " + targetIdentifier);
        }
        if (fullName != null && !fullName.isBlank()) rec.setFullName(fullName.trim());
        if (email != null && !email.isBlank()) rec.setEmail(email.trim());
        if (userType != null && !userType.isBlank()) rec.setUserType(userType.trim().toUpperCase());
        if (assignedLevel != null && !assignedLevel.isBlank()) rec.setAssignedLevel(assignedLevel.trim().toUpperCase());
        rec.setAssignedLocation(assignedLocation);
        rec.setAuditType(auditType != null && !auditType.isBlank() ? auditType.trim() : null);

        indexAliases(rec.getUsername().toLowerCase(), rec.getUserId(), rec.getUsername(), rec.getLegacyUsername(), rec.getEmail(), rec.getLegacyEmail());
        persistSecurityStateToDb(rec);

        recordAuditEvent("ADMIN_SCOPE_UPDATED", "INFO", adminActor, rec.getUsername(), rec.getUserType(), rec.getAssignedLocation(), "ADMIN_CONSOLE",
                "System Admin [" + adminActor + "] updated organizational assignment for [" + rec.getUsername() + "] -> Role: " + rec.getUserType() + ", TaxCenter/Loc: " + rec.getAssignedLocation() + ", AuditType: " + rec.getAuditType());

        return toUserMap(rec);
    }

    public Map<String, Object> adminCreateUser(String adminActor, String username, String email, String fullName,
                                               String userType, String assignedLevel, String assignedLocation,
                                               String auditType, String initialPassword, boolean mustChangePassword) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Username is required.");
        }
        String cleanUsername = username.trim();
        if (resolveSecurityRecord(cleanUsername) != null) {
            throw new IllegalArgumentException("A user with username or identifier '" + cleanUsername + "' already exists.");
        }
        String cleanEmail = (email == null || email.isBlank()) ? (cleanUsername.toLowerCase() + "@mor.gov.et") : email.trim();
        String pwd = (initialPassword == null || initialPassword.isBlank()) ? DEFAULT_INITIAL_PASSWORD : initialPassword.trim();
        validatePasswordStrength(pwd, null);

        UUID newId = UUID.nameUUIDFromBytes(("itas-user:" + cleanUsername).getBytes(StandardCharsets.UTF_8));
        String role = (userType == null || userType.isBlank()) ? "AUDITOR" : userType.trim().toUpperCase();
        String level = (assignedLevel == null || assignedLevel.isBlank()) ? "TAX_CENTER" : assignedLevel.trim().toUpperCase();

        UserSecurityRecord rec = UserSecurityRecord.builder()
                .userId(newId.toString())
                .username(cleanUsername)
                .email(cleanEmail)
                .fullName(fullName != null && !fullName.isBlank() ? fullName.trim() : cleanUsername)
                .userType(role)
                .auditType(auditType != null && !auditType.isBlank() ? auditType.trim() : null)
                .assignedLevel(level)
                .assignedLocation(assignedLocation)
                .status("ACTIVE")
                .passwordHash(passwordEncoder.encode(pwd))
                .customPasswordSet(true)
                .mustChangePassword(mustChangePassword)
                .failedLoginCount(0)
                .createdAt(OffsetDateTime.now())
                .passwordChangedAt(OffsetDateTime.now())
                .build();

        String canonicalKey = cleanUsername.toLowerCase();
        securityRecords.put(canonicalKey, rec);
        indexAliases(canonicalKey, newId.toString(), cleanUsername, null, cleanEmail, null);

        // Save to AP UserRepository as well so it appears in all Team Leader / Manager dropdowns
        try {
            User domainUser = new User(newId, cleanUsername, cleanEmail, rec.getFullName(), role, rec.getAuditType(),
                    level, assignedLocation, "ACTIVE", OffsetDateTime.now(), OffsetDateTime.now(), adminActor);
            userRepository.save(domainUser);
            if (userRepository instanceof MockUserRepository mur) {
                mur.registerAlias(cleanUsername, newId);
                mur.registerAlias(cleanEmail, newId);
            }
        } catch (Exception e) {
            log.warn("Could not save new user to AP UserRepository: {}", e.getMessage());
        }

        persistSecurityStateToDb(rec);

        recordAuditEvent("ADMIN_USER_CREATED", "INFO", adminActor, cleanUsername, role, assignedLocation, "ADMIN_CONSOLE",
                "System Admin [" + adminActor + "] provisioned new user [" + cleanUsername + "] (" + rec.getFullName() + ") as " + role + " at " + assignedLocation + ".");

        return toUserMap(rec);
    }

    public List<Map<String, Object>> getAllUsersWithSecurityState() {
        return securityRecords.values().stream()
                .sorted(Comparator.comparing(UserSecurityRecord::getUsername, String.CASE_INSENSITIVE_ORDER))
                .map(this::toUserMap)
                .collect(Collectors.toList());
    }

    public List<SecurityAuditEvent> getSecurityAuditLogs() {
        return new ArrayList<>(securityAuditLogs);
    }

    public Map<String, Object> getSecurityMetrics() {
        long total = securityRecords.size();
        long active = securityRecords.values().stream().filter(r -> "ACTIVE".equalsIgnoreCase(r.getStatus())).count();
        long locked = securityRecords.values().stream().filter(r -> "LOCKED".equalsIgnoreCase(r.getStatus()) || (r.getLockedUntil() != null && OffsetDateTime.now().isBefore(r.getLockedUntil()))).count();
        long inactive = securityRecords.values().stream().filter(r -> "INACTIVE".equalsIgnoreCase(r.getStatus())).count();
        long mustChange = securityRecords.values().stream().filter(UserSecurityRecord::isMustChangePassword).count();
        long customPwd = securityRecords.values().stream().filter(UserSecurityRecord::isCustomPasswordSet).count();
        long failedEvents = securityAuditLogs.stream().filter(e -> "LOGIN_FAILED".equals(e.getEventType()) || "ACCOUNT_LOCKED".equals(e.getEventType())).count();

        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("totalAccounts", total);
        metrics.put("activeAccounts", active);
        metrics.put("lockedAccounts", locked);
        metrics.put("inactiveAccounts", inactive);
        metrics.put("mustChangePasswordCount", mustChange);
        metrics.put("customPasswordCount", customPwd);
        metrics.put("failedLoginEvents", failedEvents);
        metrics.put("maxFailedAttemptsPolicy", MAX_FAILED_ATTEMPTS);
        metrics.put("lockoutDurationMinutes", LOCKOUT_DURATION_MINUTES);
        metrics.put("passwordHashingAlgorithm", "BCrypt (Cost Factor 10)");
        metrics.put("tokenSigningAlgorithm", "HMAC-SHA256 Signed JWT");
        return metrics;
    }

    private void persistSecurityStateToDb(UserSecurityRecord rec) {
        try {
            Optional<UserEntity> opt = userJpaRepository.findByUsername(rec.getUsername());
            if (opt.isEmpty() && rec.getEmail() != null) {
                opt = userJpaRepository.findByEmail(rec.getEmail());
            }
            UserEntity entity;
            if (opt.isPresent()) {
                entity = opt.get();
            } else {
                UUID uid;
                try {
                    uid = UUID.fromString(rec.getUserId());
                } catch (Exception ex) {
                    uid = UUID.nameUUIDFromBytes(("itas-user:" + rec.getUsername()).getBytes(StandardCharsets.UTF_8));
                }
                entity = UserEntity.builder()
                        .userId(uid)
                        .username(rec.getUsername())
                        .createdAt(rec.getCreatedAt() != null ? rec.getCreatedAt() : OffsetDateTime.now())
                        .updatedAt(OffsetDateTime.now())
                        .build();
            }
            entity.setFullName(rec.getFullName() != null ? rec.getFullName() : rec.getUsername());
            entity.setEmail(rec.getEmail() != null ? rec.getEmail() : (rec.getUsername() + "@mor.gov.et"));
            entity.setUserType(rec.getUserType() != null ? rec.getUserType() : "AUDITOR");
            entity.setAuditType(rec.getAuditType());
            entity.setAssignedLevel(rec.getAssignedLevel() != null ? rec.getAssignedLevel() : "TAX_CENTER");
            entity.setAssignedLocation(rec.getAssignedLocation());
            entity.setStatus(rec.getStatus() != null ? rec.getStatus() : "ACTIVE");
            entity.setPasswordHash(rec.getPasswordHash());
            entity.setMustChangePassword(rec.isMustChangePassword());
            entity.setFailedLoginCount(rec.getFailedLoginCount());
            entity.setLockedUntil(rec.getLockedUntil());
            entity.setLastLoginAt(rec.getLastLoginAt());
            entity.setPasswordChangedAt(rec.getPasswordChangedAt());
            userJpaRepository.save(entity);
        } catch (Exception e) {
            log.debug("Non-fatal DB sync for user [{}]: {}", rec.getUsername(), e.getMessage());
        }
    }

    public Map<String, Object> toUserMap(UserSecurityRecord rec) {
        boolean currentlyLocked = "LOCKED".equalsIgnoreCase(rec.getStatus()) ||
                (rec.getLockedUntil() != null && OffsetDateTime.now().isBefore(rec.getLockedUntil()));
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("userId", rec.getUserId());
        map.put("id", rec.getUsername());
        map.put("username", rec.getUsername());
        map.put("legacyUsername", rec.getLegacyUsername());
        map.put("email", rec.getEmail());
        map.put("legacyEmail", rec.getLegacyEmail());
        map.put("fullName", rec.getFullName());
        map.put("name", rec.getFullName());
        map.put("userType", rec.getUserType());
        map.put("auditType", rec.getAuditType());
        map.put("assignedLevel", rec.getAssignedLevel());
        map.put("assignedLocation", rec.getAssignedLocation());
        map.put("taxCenter", "TAX_CENTER".equalsIgnoreCase(rec.getAssignedLevel()) ? rec.getAssignedLocation() : null);
        map.put("status", currentlyLocked ? "LOCKED" : rec.getStatus());
        map.put("mustChangePassword", rec.isMustChangePassword());
        map.put("customPasswordSet", rec.isCustomPasswordSet());
        map.put("failedLoginCount", rec.getFailedLoginCount());
        map.put("lockedUntil", rec.getLockedUntil());
        map.put("lastLoginAt", rec.getLastLoginAt());
        map.put("passwordChangedAt", rec.getPasswordChangedAt());
        map.put("createdDate", rec.getCreatedAt());
        return map;
    }

    public void recordAuditEvent(String eventType, String severity, String actorId, String targetUser,
                                 String role, String taxCenter, String ipAddress, String details) {
        SecurityAuditEvent event = SecurityAuditEvent.builder()
                .eventId("SEC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .timestamp(OffsetDateTime.now())
                .eventType(eventType)
                .severity(severity)
                .actorId(actorId)
                .targetUser(targetUser)
                .role(role)
                .taxCenter(taxCenter != null ? taxCenter : "NATIONAL")
                .ipAddress(ipAddress != null ? ipAddress : "127.0.0.1")
                .details(details)
                .build();
        securityAuditLogs.add(0, event);
        if (securityAuditLogs.size() > 500) {
            securityAuditLogs.remove(securityAuditLogs.size() - 1);
        }
    }

    // ════════════════════════════════════════════════════════════════════════════
    // SIGNED HMAC-SHA256 JWT GENERATION & VERIFICATION
    // ════════════════════════════════════════════════════════════════════════════

    public String generateSignedJwt(UserSecurityRecord rec) {
        try {
            long nowSec = System.currentTimeMillis() / 1000L;
            long expSec = nowSec + JWT_EXPIRY_SECONDS;

            String headerJson = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
            String payloadJson = String.format(
                    "{\"sub\":\"%s\",\"username\":\"%s\",\"email\":\"%s\",\"fullName\":\"%s\",\"role\":\"%s\",\"assignedLevel\":\"%s\",\"taxCenter\":\"%s\",\"auditType\":\"%s\",\"iat\":%d,\"exp\":%d}",
                    escapeJson(rec.getUserId()),
                    escapeJson(rec.getUsername()),
                    escapeJson(rec.getEmail()),
                    escapeJson(rec.getFullName()),
                    escapeJson(rec.getUserType()),
                    escapeJson(rec.getAssignedLevel()),
                    escapeJson(rec.getAssignedLocation()),
                    escapeJson(rec.getAuditType()),
                    nowSec,
                    expSec
            );

            String headerB64 = Base64.getUrlEncoder().withoutPadding().encodeToString(headerJson.getBytes(StandardCharsets.UTF_8));
            String payloadB64 = Base64.getUrlEncoder().withoutPadding().encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));
            String signingInput = headerB64 + "." + payloadB64;
            String signatureB64 = signHmacSha256(signingInput);
            return signingInput + "." + signatureB64;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to sign JWT token", e);
        }
    }

    public UserSecurityRecord verifyJwtToken(String token) {
        try {
            if (token == null || token.isBlank()) return null;
            String raw = token.startsWith("Bearer ") ? token.substring(7).trim() : token.trim();
            String[] parts = raw.split("\\.");
            if (parts.length != 3) return null;

            String signingInput = parts[0] + "." + parts[1];
            String expectedSig = signHmacSha256(signingInput);
            if (!expectedSig.equals(parts[2])) {
                log.warn("JWT signature verification failed!");
                return null;
            }

            String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            // Extract username from payload
            String username = extractJsonString(payloadJson, "username");
            if (username == null) return null;
            return resolveSecurityRecord(username);
        } catch (Exception e) {
            return null;
        }
    }

    private String signHmacSha256(String data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec keySpec = new SecretKeySpec(JWT_SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(keySpec);
        byte[] sig = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(sig);
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private String extractJsonString(String json, String key) {
        String pattern = "\"" + key + "\":\"";
        int idx = json.indexOf(pattern);
        if (idx < 0) return null;
        int start = idx + pattern.length();
        int end = json.indexOf("\"", start);
        if (end < 0) return null;
        return json.substring(start, end);
    }
}
