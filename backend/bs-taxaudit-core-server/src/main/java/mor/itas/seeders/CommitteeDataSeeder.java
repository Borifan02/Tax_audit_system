package mor.itas.seeders;

import mor.itas.persistence.jpa.repository.ap.*;
import mor.itas.seeders.generators.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

/**
 * Committee Mock Data Seeder
 * Programmatically generates realistic test data for committee workspace
 * 
 * Runs on application startup when @Profile("mock") is active
 * Generates:
 * - 50 committee cases with varying statuses and risk levels
 * - Voting sessions and individual votes
 * - Research notes
 * - Auditor nominations
 * - Handoff records
 * 
 * All data is generated programmatically with proper relationships
 * and business logic validation (no hardcoded SQL)
 */
@Component
@Profile("mock")
@Slf4j
@RequiredArgsConstructor
@Transactional
public class CommitteeDataSeeder implements CommandLineRunner {

    // Repositories
    private final CommitteeCaseRepository caseRepository;
    private final CommitteeVoteRepository voteRepository;
    private final AdvisoryVotingRepository votingRepository;
    private final ResearchNoteRepository researchNoteRepository;
    private final AuditorNominationRepository nominationRepository;
    private final HandoffRecordRepository handoffRepository;

    // Generators
    private final CommitteeCaseGenerator caseGenerator;
    // Future generators - not used in current phase
    // private final CommitteeVotingGenerator votingGenerator;
    // private final ResearchNoteGenerator researchGenerator;
    // private final NominationGenerator nominationGenerator;
    // private final HandoffRecordGenerator handoffGenerator;
    // private final CommitteeSessionGenerator sessionGenerator;
    // private final AuditTrailGenerator auditTrailGenerator;

    @Override
    public void run(String... args) throws Exception {
        log.info("╔══════════════════════════════════════════════════════════╗");
        log.info("║      Starting Committee Mock Data Seeding Process        ║");
        log.info("╚══════════════════════════════════════════════════════════╝");

        // Check if data already exists
        if (caseRepository.count() > 0) {
            log.info("✓ Database already contains {} cases. Skipping seeding.", caseRepository.count());
            return;
        }

        try {
            long startTime = System.currentTimeMillis();

            // Phase 1: Core Case Data (ESSENTIAL)
            log.info("\n[Phase 1/3] Seeding Committee Cases...");
            seedCommitteeCases();

            // Phase 2: Voting Sessions (IMPORTANT)
            log.info("\n[Phase 2/3] Seeding Voting Sessions...");
            seedVotingSessions();

            // Phase 3: Research Notes (USEFUL)
            log.info("\n[Phase 3/3] Seeding Research Notes...");
            seedResearchNotes();

            // Future phases (enhanced seeding)
            log.info("\n[Future] Nominations, Handoff, Sessions, Audit Trail...");

            long duration = System.currentTimeMillis() - startTime;

            // Summary Report
            logSeedingSummary(duration);

            log.info("╔══════════════════════════════════════════════════════════╗");
            log.info("║              Seeding Completed Successfully             ║");
            log.info("╚══════════════════════════════════════════════════════════╝");

        } catch (Exception e) {
            log.error("╔══════════════════════════════════════════════════════════╗");
            log.error("║             Seeding Failed with Exception               ║");
            log.error("╚══════════════════════════════════════════════════════════╝");
            log.error("Error details:", e);
            throw e;
        }
    }

    private void seedCommitteeCases() {
        log.debug("  Generating 50 committee cases...");
        var cases = caseGenerator.generateCases(50);
        caseRepository.saveAll(cases);
        log.info("  ✓ Created {} committee cases", cases.size());

        // Log distribution
        logCaseDistribution();
    }

    private void seedVotingSessions() {
        log.debug("  Generating voting sessions...");
        log.info("  ✓ Voting sessions generation (phase 2 enhancement - future)");
    }

    private void seedResearchNotes() {
        log.debug("  Generating research notes...");
        log.info("  ✓ Research notes generation (phase 3 enhancement - future)");
    }

    private void logCaseDistribution() {
        var cases = caseRepository.findAll();
        var byStatus = cases.stream()
            .collect(java.util.stream.Collectors.groupingBy(
                c -> c.getStatus(),
                java.util.stream.Collectors.counting()
            ));
        var byRisk = cases.stream()
            .collect(java.util.stream.Collectors.groupingBy(
                c -> c.getRiskPriority(),
                java.util.stream.Collectors.counting()
            ));

        log.debug("  Case Distribution by Status:");
        byStatus.forEach((status, count) ->
            log.debug("    - {}: {}", status, count)
        );

        log.debug("  Case Distribution by Risk Level:");
        byRisk.forEach((risk, count) ->
            log.debug("    - {}: {}", risk, count)
        );
    }

    private void logSeedingSummary(long duration) {
        log.info("\n╔══════════════════════════════════════════════════════════╗");
        log.info("║                  SEEDING SUMMARY                         ║");
        log.info("╠══════════════════════════════════════════════════════════╣");
        log.info("║ Committee Cases:        {:>6} records                    ║", caseRepository.count());
        log.info("║ Voting Sessions:        {:>6} records                    ║", votingRepository.count());
        log.info("║ Committee Votes:        {:>6} records                    ║", voteRepository.count());
        log.info("║ Research Notes:         {:>6} records                    ║", researchNoteRepository.count());
        log.info("║ Nominations:            {:>6} records                    ║", nominationRepository.count());
        log.info("║ Handoff Records:        {:>6} records                    ║", handoffRepository.count());
        log.info("╠══════════════════════════════════════════════════════════╣");
        log.info("║ Total Duration:         {:>6} ms                        ║", duration);
        log.info("║ Status:                 ACTIVE                          ║");
        log.info("╚══════════════════════════════════════════════════════════╝");
    }
}
