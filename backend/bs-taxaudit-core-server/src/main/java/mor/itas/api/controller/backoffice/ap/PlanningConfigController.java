package mor.itas.api.controller.backoffice.ap;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import mor.itas.api.dto.response.ap.GenericResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.*;

/**
 * PlanningConfigController — REST controller for dynamic audit planning & resource configuration.
 * 
 * Backed by PostgreSQL table `ap_planning_configuration` to ensure persistent storage of:
 * 1. Audit Types (name, effort hours per case, complexity, revenue per case, governance routing, active status)
 * 2. Auditor Capacity & Available Resources (annual working days, daily hours, direct productive ratio)
 * 3. Configurable Regions (Add / Remove / Edit regions) & Nested Tax Centers (optional per region)
 * 4. Effort Estimation & Multipliers (complexity multipliers, contingency buffer)
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/backoffice/ap/config/planning")
@CrossOrigin(origins = "*")
public class PlanningConfigController {

    private static final String CONFIG_ID = "ACTIVE_CONFIG";
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public PlanningConfigController(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * GET /api/v1/backoffice/ap/config/planning
     * Retrieves active configuration from PostgreSQL, or falls back to statutory defaults.
     */
    @GetMapping
    public ResponseEntity<GenericResponse<Map<String, Object>>> getPlanningConfig() {
        try {
            List<Map<String, Object>> rows = jdbcTemplate.query(
                "SELECT config_data, version, updated_by, updated_at FROM ap_planning_configuration WHERE id = ?",
                (rs, rowNum) -> {
                    Map<String, Object> result = new LinkedHashMap<>();
                    try {
                        String json = rs.getString("config_data");
                        Map<String, Object> data = objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
                        result.putAll(data);
                    } catch (Exception e) {
                        log.error("Failed to parse planning config json: {}", e.getMessage());
                    }
                    result.put("version", rs.getInt("version"));
                    result.put("updatedBy", rs.getString("updated_by"));
                    result.put("lastUpdated", rs.getTimestamp("updated_at") != null 
                        ? rs.getTimestamp("updated_at").toInstant().toString() 
                        : OffsetDateTime.now().toString());
                    return result;
                },
                CONFIG_ID
            );

            if (!rows.isEmpty()) {
                return ResponseEntity.ok(GenericResponse.success(rows.get(0)));
            }
        } catch (Exception e) {
            log.error("Database query failed for planning config: {}", e.getMessage());
        }

        // Fallback to statutory default and persist
        Map<String, Object> defaultConfig = buildDefaultConfig();
        saveConfigToDatabase(defaultConfig, "SYSTEM_DEFAULT", 1);
        defaultConfig.put("version", 1);
        defaultConfig.put("updatedBy", "SYSTEM_DEFAULT");
        defaultConfig.put("lastUpdated", OffsetDateTime.now().toString());
        return ResponseEntity.ok(GenericResponse.success(defaultConfig));
    }

    /**
     * PUT /api/v1/backoffice/ap/config/planning
     * Persists updated configuration to PostgreSQL and synchronizes master tables.
     */
    @PutMapping
    public ResponseEntity<GenericResponse<Map<String, Object>>> updatePlanningConfig(@RequestBody Map<String, Object> newConfig) {
        if (newConfig == null || newConfig.isEmpty()) {
            return ResponseEntity.badRequest().body(GenericResponse.error("INVALID_CONFIG", "Configuration payload cannot be empty"));
        }

        try {
            Integer currentVersion = 1;
            try {
                currentVersion = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(MAX(version), 0) FROM ap_planning_configuration WHERE id = ?",
                    Integer.class,
                    CONFIG_ID
                );
            } catch (Exception ignored) {}
            if (currentVersion == null) currentVersion = 0;
            int newVersion = currentVersion + 1;
            String updatedBy = String.valueOf(newConfig.getOrDefault("updatedBy", "Audit Planning Team"));

            Map<String, Object> configToSave = new LinkedHashMap<>(newConfig);
            configToSave.remove("version");
            configToSave.remove("lastUpdated");
            configToSave.remove("updatedBy");

            saveConfigToDatabase(configToSave, updatedBy, newVersion);
            syncMasterTables(configToSave);

            Map<String, Object> response = new LinkedHashMap<>(configToSave);
            response.put("version", newVersion);
            response.put("updatedBy", updatedBy);
            response.put("lastUpdated", OffsetDateTime.now().toString());

            return ResponseEntity.ok(GenericResponse.success(response));
        } catch (Exception e) {
            log.error("Failed to update planning config in database: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(GenericResponse.error("DB_ERROR", "Failed to persist configuration: " + e.getMessage()));
        }
    }

    /**
     * POST /api/v1/backoffice/ap/config/planning/reset
     * Resets configuration to statutory Ministry defaults in PostgreSQL.
     */
    @PostMapping("/reset")
    public ResponseEntity<GenericResponse<Map<String, Object>>> resetPlanningConfig() {
        Map<String, Object> defaultConfig = buildDefaultConfig();
        saveConfigToDatabase(defaultConfig, "SYSTEM_DEFAULT", 1);
        syncMasterTables(defaultConfig);
        defaultConfig.put("version", 1);
        defaultConfig.put("updatedBy", "SYSTEM_DEFAULT");
        defaultConfig.put("lastUpdated", OffsetDateTime.now().toString());
        return ResponseEntity.ok(GenericResponse.success(defaultConfig));
    }

    private void saveConfigToDatabase(Map<String, Object> config, String updatedBy, int version) {
        try {
            String json = objectMapper.writeValueAsString(config);
            jdbcTemplate.update(
                "INSERT INTO ap_planning_configuration (id, config_data, version, updated_by, updated_at) " +
                "VALUES (?, ?::jsonb, ?, ?, CURRENT_TIMESTAMP) " +
                "ON CONFLICT (id) DO UPDATE SET config_data = EXCLUDED.config_data, version = EXCLUDED.version, " +
                "updated_by = EXCLUDED.updated_by, updated_at = EXCLUDED.updated_at",
                CONFIG_ID, json, version, updatedBy
            );
        } catch (Exception e) {
            log.error("Failed to save planning config to PostgreSQL: {}", e.getMessage(), e);
            throw new RuntimeException("Could not persist planning configuration to database", e);
        }
    }

    private void syncMasterTables(Map<String, Object> config) {
        try {
            // 1. Sync Audit Types
            Object typesObj = config.get("auditTypes");
            if (typesObj instanceof List<?> typesList) {
                for (Object item : typesList) {
                    if (item instanceof Map<?, ?> typeMap) {
                        String id = String.valueOf(typeMap.get("id"));
                        String name = String.valueOf(typeMap.get("name"));
                        String code = id.toUpperCase().replace(" ", "_");
                        boolean reqCommittee = "COMMITTEE".equalsIgnoreCase(String.valueOf(typeMap.get("governanceRouting")));
                        String role = typeMap.get("governanceRouting") != null ? String.valueOf(typeMap.get("governanceRouting")) : "TEAM_LEADER";
                        boolean active = !Boolean.FALSE.equals(typeMap.get("active"));

                        jdbcTemplate.update(
                            "INSERT INTO audit_types (code, name, requires_committee, initial_assignment_role, is_active) " +
                            "VALUES (?, ?, ?, ?, ?) " +
                            "ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, requires_committee = EXCLUDED.requires_committee, " +
                            "initial_assignment_role = EXCLUDED.initial_assignment_role, is_active = EXCLUDED.is_active",
                            code, name, reqCommittee, role, active
                        );
                    }
                }
            }

            // 2. Sync Regions
            Object regionsObj = config.get("regions");
            if (regionsObj instanceof List<?> regionsList) {
                for (Object item : regionsList) {
                    if (item instanceof Map<?, ?> regMap) {
                        String name = String.valueOf(regMap.get("name"));
                        String code = regMap.get("code") != null 
                            ? String.valueOf(regMap.get("code")).toUpperCase().trim() 
                            : name.substring(0, Math.min(2, name.length())).toUpperCase();
                        boolean active = !Boolean.FALSE.equals(regMap.get("active"));

                        jdbcTemplate.update(
                            "INSERT INTO regions (code, name, is_active, updated_at) " +
                            "VALUES (?, ?, ?, CURRENT_TIMESTAMP) " +
                            "ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, is_active = EXCLUDED.is_active, updated_at = CURRENT_TIMESTAMP",
                            code, name, active
                        );
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Master tables synchronization note: {}", e.getMessage());
        }
    }

    private Map<String, Object> buildDefaultConfig() {
        Map<String, Object> config = new LinkedHashMap<>();

        // 1. Audit Types
        List<Map<String, Object>> auditTypes = new ArrayList<>();
        auditTypes.add(createAuditType("desk_audit", "Desk Audit", "Desk", 40, "Low", 150000L, "TEAM_LEADER", "blue", "Remote audit using taxpayer electronic records & ITAS cross-matching"));
        auditTypes.add(createAuditType("field_audit", "Field Audit", "Field", 120, "Medium", 350000L, "TEAM_LEADER", "green", "Comprehensive on-site audit with physical premises verification"));
        auditTypes.add(createAuditType("joint_audit", "Joint Audit", "Joint", 160, "High", 750000L, "COMMITTEE", "purple", "Cross-directorate coordinated audit with Customs and Regional offices"));
        auditTypes.add(createAuditType("transfer_pricing", "Transfer Pricing", "TP", 80, "High", 1500000L, "COMMITTEE", "orange", "Specialized cross-border intercompany transaction & BEPS examination"));
        auditTypes.add(createAuditType("comprehensive", "Comprehensive", "Comp", 200, "Very High", 1000000L, "TEAM_LEADER", "red", "Full-scope statutory corporate income tax, VAT, and excise audit"));
        auditTypes.add(createAuditType("issue_audit", "Issue Audit", "Issue", 50, "Medium", 250000L, "TEAM_LEADER", "teal", "Targeted single-issue or specific risk transaction examination"));
        config.put("auditTypes", auditTypes);

        // 2. Capacity & Resource Parameters
        Map<String, Object> capacity = new LinkedHashMap<>();
        capacity.put("workingDaysPerYear", 220);
        capacity.put("hoursPerDay", 8.0);
        capacity.put("directProductiveRatio", 0.75);
        capacity.put("annualTrainingDays", 5);
        capacity.put("annualLeaveDays", 20);
        
        Map<String, Integer> regionalHeadcount = new LinkedHashMap<>();
        regionalHeadcount.put("federal_level", 120);
        regionalHeadcount.put("addis_ababa", 600);
        regionalHeadcount.put("oromia", 400);
        regionalHeadcount.put("amhara", 250);
        regionalHeadcount.put("dire_dawa", 50);
        regionalHeadcount.put("snnpr", 80);
        regionalHeadcount.put("somali", 100);
        regionalHeadcount.put("sidama", 100);
        capacity.put("regionalHeadcount", regionalHeadcount);
        config.put("capacity", capacity);

        // 3. Configurable Regions with Optional Nested Tax Centers
        List<Map<String, Object>> regions = new ArrayList<>();
        regions.add(createRegion("federal_level", "Federal Level (LTO)", "FED", 120, 150000L, Arrays.asList(
            createTaxCenter("federal-lto1", "Federal Large Taxpayers Office 1", "FED-LTO1"),
            createTaxCenter("federal-lto2", "Federal Large Taxpayers Office 2", "FED-LTO2")
        )));
        regions.add(createRegion("addis_ababa", "Addis Ababa", "AA", 600, 2500000L, Arrays.asList(
            createTaxCenter("addis_ababa-tc1", "Addis Ababa TC1", "AA-TC1"),
            createTaxCenter("addis_ababa-tc2", "Addis Ababa TC2", "AA-TC2"),
            createTaxCenter("addis_ababa-tc3", "Addis Ababa TC3", "AA-TC3")
        )));
        regions.add(createRegion("oromia", "Oromia", "BB", 400, 1300000L, Arrays.asList(
            createTaxCenter("oromia-tc1", "Oromia TC1", "BB-TC1"),
            createTaxCenter("oromia-tc2", "Oromia TC2", "BB-TC2"),
            createTaxCenter("oromia-tc3", "Oromia TC3", "BB-TC3")
        )));
        regions.add(createRegion("amhara", "Amhara", "BA", 250, 750000L, Arrays.asList(
            createTaxCenter("amhara-tc1", "Amhara TC1", "BA-TC1"),
            createTaxCenter("amhara-tc2", "Amhara TC2", "BA-TC2"),
            createTaxCenter("amhara-tc3", "Amhara TC3", "BA-TC3")
        )));
        regions.add(createRegion("dire_dawa", "Dire Dawa", "AB", 50, 100000L, Arrays.asList(
            createTaxCenter("dire_dawa-tc1", "Dire Dawa TC1", "AB-TC1"),
            createTaxCenter("dire_dawa-tc2", "Dire Dawa TC2", "AB-TC2"),
            createTaxCenter("dire_dawa-tc3", "Dire Dawa TC3", "AB-TC3")
        )));
        regions.add(createRegion("snnpr", "SNNPR", "CA", 80, 280000L, Arrays.asList(
            createTaxCenter("snnpr-tc1", "SNNPR TC1", "CA-TC1"),
            createTaxCenter("snnpr-tc2", "SNNPR TC2", "CA-TC2"),
            createTaxCenter("snnpr-tc3", "SNNPR TC3", "CA-TC3")
        )));
        regions.add(createRegion("somali", "Somali", "SO", 100, 200000L, Arrays.asList(
            createTaxCenter("somali-tc1", "Somali TC1", "SO-TC1"),
            createTaxCenter("somali-tc2", "Somali TC2", "SO-TC2"),
            createTaxCenter("somali-tc3", "Somali TC3", "SO-TC3")
        )));
        regions.add(createRegion("sidama", "Sidama", "SI", 100, 350000L, new ArrayList<>()));
        config.put("regions", regions);

        // 4. Effort Estimation & Multipliers
        Map<String, Object> effortEstimation = new LinkedHashMap<>();
        Map<String, Double> complexityMultipliers = new LinkedHashMap<>();
        complexityMultipliers.put("Low", 0.85);
        complexityMultipliers.put("Medium", 1.0);
        complexityMultipliers.put("High", 1.35);
        complexityMultipliers.put("Very High", 1.70);
        effortEstimation.put("complexityMultipliers", complexityMultipliers);
        effortEstimation.put("contingencyBufferPercentage", 15);
        effortEstimation.put("travelOverheadHoursPerFieldCase", 16);
        config.put("effortEstimation", effortEstimation);

        return config;
    }

    private Map<String, Object> createAuditType(String id, String name, String shortName, int effortPerCase, 
                                                String complexity, long revenuePerCase, String governanceRouting, 
                                                String color, String description) {
        Map<String, Object> type = new LinkedHashMap<>();
        type.put("id", id);
        type.put("name", name);
        type.put("shortName", shortName);
        type.put("effortPerCase", effortPerCase);
        type.put("complexity", complexity);
        type.put("revenuePerCase", revenuePerCase);
        type.put("governanceRouting", governanceRouting);
        type.put("color", color);
        type.put("description", description);
        type.put("active", true);
        return type;
    }

    private Map<String, Object> createRegion(String id, String name, String code, int headcount, long taxpayers, List<Map<String, String>> taxCenters) {
        Map<String, Object> reg = new LinkedHashMap<>();
        reg.put("id", id);
        reg.put("name", name);
        reg.put("code", code);
        reg.put("headcount", headcount);
        reg.put("taxpayers", taxpayers);
        reg.put("taxCenters", taxCenters != null ? new ArrayList<>(taxCenters) : new ArrayList<>());
        reg.put("active", true);
        return reg;
    }

    private Map<String, String> createTaxCenter(String id, String name, String shortName) {
        Map<String, String> tc = new LinkedHashMap<>();
        tc.put("id", id);
        tc.put("name", name);
        tc.put("shortName", shortName);
        return tc;
    }
}
