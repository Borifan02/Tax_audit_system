package mor.itas.api.controller.backoffice.ap;

import mor.itas.api.dto.request.ap.CreateCommitteeRequest;
import mor.itas.api.dto.response.ap.CommitteeResponse;
import mor.itas.application.usecase.ap.CommitteeManagementUseCase;
import mor.itas.domain.model.ap.Committee;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Backoffice REST Controller for Committee Management (AP Cluster)
 */
@RestController
@RequestMapping("/api/v1/backoffice/ap/committees")
@RequiredArgsConstructor
public class CommitteeController {

    private final CommitteeManagementUseCase committeeManagementUseCase;

    @PostMapping
    public ResponseEntity<CommitteeResponse> createCommittee(
            @RequestBody CreateCommitteeRequest request,
            @RequestHeader("X-Actor-Id") String actorId) {
        try {
            Committee committee = committeeManagementUseCase.createCommittee(
                request.getCommitteeName(),
                request.getCommitteeType(),
                request.getLevel(),
                request.getLocation(),
                request.getChairId(),
                actorId
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(mapCommitteeToResponse(committee));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping
    public ResponseEntity<List<CommitteeResponse>> getAllCommittees(
            @RequestHeader("X-Actor-Id") String actorId) {
        List<Committee> committees = committeeManagementUseCase.getAllCommittees();
        return ResponseEntity.ok(
            committees.stream().map(this::mapCommitteeToResponse).collect(Collectors.toList())
        );
    }

    @GetMapping("/{committeeId}")
    public ResponseEntity<CommitteeResponse> getCommitteeById(
            @PathVariable UUID committeeId,
            @RequestHeader("X-Actor-Id") String actorId) {
        try {
            Committee committee = committeeManagementUseCase.getCommitteeById(committeeId);
            return ResponseEntity.ok(mapCommitteeToResponse(committee));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PostMapping("/{committeeId}/members")
    public ResponseEntity<Map<String, Object>> addMember(
            @PathVariable UUID committeeId,
            @RequestParam UUID memberId,
            @RequestHeader("X-Actor-Id") String actorId) {
        try {
            Committee updated = committeeManagementUseCase.addMember(committeeId, memberId, actorId);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "SUCCESS");
            response.put("committee", mapCommitteeToResponse(updated));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @DeleteMapping("/{committeeId}/members/{memberId}")
    public ResponseEntity<Map<String, Object>> removeMember(
            @PathVariable UUID committeeId,
            @PathVariable UUID memberId,
            @RequestHeader("X-Actor-Id") String actorId) {
        try {
            Committee updated = committeeManagementUseCase.removeMember(committeeId, memberId, actorId);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "SUCCESS");
            response.put("committee", mapCommitteeToResponse(updated));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                Map.of("error", e.getMessage())
            );
        }
    }

    @PutMapping("/{committeeId}/capacity")
    public ResponseEntity<CommitteeResponse> updateCapacity(
            @PathVariable UUID committeeId,
            @RequestParam Integer newCapacity,
            @RequestHeader("X-Actor-Id") String actorId) {
        try {
            Committee updated = committeeManagementUseCase.updateCapacity(committeeId, newCapacity, actorId);
            return ResponseEntity.ok(mapCommitteeToResponse(updated));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/{committeeId}/workload")
    public ResponseEntity<Map<String, Object>> getWorkload(
            @PathVariable UUID committeeId,
            @RequestHeader("X-Actor-Id") String actorId) {
        try {
            Map<String, Object> workload = committeeManagementUseCase.getWorkloadInfo(committeeId);
            return ResponseEntity.ok(workload);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics(
            @RequestHeader("X-Actor-Id") String actorId) {
        Map<String, Object> stats = committeeManagementUseCase.getCommitteeStatistics();
        return ResponseEntity.ok(stats);
    }

    private CommitteeResponse mapCommitteeToResponse(Committee committee) {
        return CommitteeResponse.builder()
            .committeeId(committee.getCommitteeId())
            .committeeName(committee.getCommitteeName())
            .committeeType(committee.getCommitteeType())
            .level(committee.getLevel())
            .location(committee.getLocation())
            .chairId(committee.getChairId())
            .memberIds(new ArrayList<>(committee.getMemberIds()))
            .capacity(committee.getCapacity())
            .currentLoad(committee.getCurrentLoad())
            .status(committee.getStatus())
            .createdDate(committee.getCreatedDate())
            .lastModified(committee.getLastModified())
            .build();
    }
}
