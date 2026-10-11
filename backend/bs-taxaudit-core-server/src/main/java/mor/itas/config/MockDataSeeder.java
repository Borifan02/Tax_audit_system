package mor.itas.config;

import lombok.RequiredArgsConstructor;
import mor.itas.engineadapter.usermanagement.MockUserManagementAdapter;
import mor.itas.application.port.outboundport.repositoryport.ap.UserRepository;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;
import mor.itas.persistence.jpa.repository.ap.ApAuditCaseRepository;
import mor.itas.domain.model.ap.User;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

import java.util.UUID;

@Component
@Profile("mock")
@RequiredArgsConstructor
public class MockDataSeeder implements CommandLineRunner {

    private final MockUserManagementAdapter mockUserManagementAdapter;
    private final UserRepository userRepository; // The AP Domain repository (MockUserRepository)
    private final ApAuditCaseRepository auditCaseRepository;
    @Override
    public void run(String... args) throws Exception {
        System.out.println("[MockDataSeeder] Starting to seed Mock Users into AP UserRepository...");
        List<Map<String, Object>> mockUsers = mockUserManagementAdapter.getAllUsers();
        
        int count = 0;
        for (Map<String, Object> mockUser : mockUsers) {
            String username = (String) mockUser.get("username");
            String fullName = (String) mockUser.get("fullName");
            String email = (String) mockUser.get("email");
            String rawUserId = (String) mockUser.get("userId");
            
            Optional<User> existing = userRepository.findByUsername(username);
            if (existing.isEmpty() || !Objects.equals(fullName, existing.get().getFullName()) || !Objects.equals(email, existing.get().getEmail())) {
                
                String userType = (String) mockUser.get("userType"); // TEAM_LEADER, AUDITOR, etc.
                String auditType = (String) mockUser.get("auditType");
                String assignedLevel = (String) mockUser.get("assignedLevel");
                String assignedLocation = (String) mockUser.get("assignedLocation");

                java.util.UUID userId = null;
                if (rawUserId != null) {
                    try {
                        userId = java.util.UUID.fromString(rawUserId);
                    } catch (IllegalArgumentException ignored) {}
                }
                if (userId == null) {
                    userId = java.util.UUID.nameUUIDFromBytes(("itas-user:" + username).getBytes(java.nio.charset.StandardCharsets.UTF_8));
                }

                User domainUser = new User(userId, username, email, fullName, userType, auditType,
                                           assignedLevel, assignedLocation, "ACTIVE",
                                           java.time.OffsetDateTime.now(), java.time.OffsetDateTime.now(), "system-seeder");
                
                userRepository.save(domainUser);
                count++;
            }

            if (userRepository instanceof mor.itas.persistence.repository.ap.MockUserRepository mur) {
                String legacyUsername = (String) mockUser.get("legacyUsername");
                String legacyEmail = (String) mockUser.get("legacyEmail");
                java.util.UUID uId = null;
                if (rawUserId != null) {
                    try { uId = java.util.UUID.fromString(rawUserId); } catch (Exception ignored) {}
                }
                if (uId == null) {
                    uId = java.util.UUID.nameUUIDFromBytes(("itas-user:" + (legacyUsername != null ? legacyUsername : username)).getBytes(java.nio.charset.StandardCharsets.UTF_8));
                }
                if (legacyUsername != null) mur.registerAlias(legacyUsername, uId);
                if (rawUserId != null) mur.registerAlias(rawUserId, uId);
                if (legacyEmail != null) mur.registerAlias(legacyEmail, uId);
            }
        }
        
        System.out.println("[MockDataSeeder] Successfully seeded " + count + " users into AP MockUserRepository!");

        // Inject Comprehensive Audit Mock Case
        java.util.UUID mockCaseId = null;
        try { mockCaseId = java.util.UUID.fromString("c0000000-0000-0000-0000-000000000101"); } catch (Exception ignored) {}
        
        if (mockCaseId != null && auditCaseRepository.findById(mockCaseId).isEmpty()) {
            ApAuditCaseEntity caCase = ApAuditCaseEntity.builder()
                .id(mockCaseId)
                .caseNumber("CA-2026-101")
                .taxpayerName("Ethio-Telecom Enterprise")
                .taxpayerId("09-8877665")
                .tin("09-8877665")
                .segment("LARGE")
                .auditType("COMPREHENSIVE_AUDIT")
                .riskScore(88)
                .riskPriority("HIGH")
                .status("ASSIGNED_TO_TEAM_LEADER")
                .assignedAuditorId("u-aud-federal-lto1-comp-1-1") // The comprehensive auditor
                .assignedTeamLeaderId("u-tl-federal-lto1-comp-1")
                .taxCenterCode("federal-lto1")
                .regionCode("federal")
                .planId(UUID.randomUUID())
                .createdBy("system")
                .caWorkflowStatus("ASSIGNED")
                .build();
            auditCaseRepository.save(caCase);
            System.out.println("[MockDataSeeder] Successfully seeded Comprehensive Audit Mock Case CA-2026-101!");
        }
    }
}
