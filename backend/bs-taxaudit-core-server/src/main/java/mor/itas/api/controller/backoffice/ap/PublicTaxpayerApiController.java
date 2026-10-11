package mor.itas.api.controller.backoffice.ap;

import mor.itas.engineadapter.taxpayer.MockTaxpayerAdapter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

/**
 * PublicTaxpayerApiController
 * Serves the exact MOR Taxpayer Registration API format (/api/public/v1/taxpayers)
 * locally, backed by the 550 deep isolated Ethiopian taxpayer profiles.
 */
@RestController
@RequestMapping("/api/public/v1")
@RequiredArgsConstructor
public class PublicTaxpayerApiController {

    private final MockTaxpayerAdapter mockTaxpayerAdapter;

    @GetMapping("/taxpayers/{tin}")
    public ResponseEntity<Map<String, Object>> getTaxpayerByTin(@PathVariable String tin) {
        Map<String, Object> tp = mockTaxpayerAdapter.getTaxpayerById(tin);
        if (tp == null) {
            Map<String, Object> err = new HashMap<>();
            err.put("data", null);
            err.put("error", Map.of("message", "Taxpayer not found for TIN: " + tin, "code", 404));
            err.put("meta", Map.of("tin", tin));
            return ResponseEntity.status(404).body(err);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("data", tp);
        response.put("error", null);
        response.put("meta", Map.of("tin", tin, "generated_at", Instant.now().toString()));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/taxpayers")
    public ResponseEntity<Map<String, Object>> getTaxpayers(
            @RequestParam(required = false) String tax_center,
            @RequestParam(required = false) String taxCenter,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String audit_type,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "100") int limit) {

        String tc = tax_center != null ? tax_center : taxCenter;
        List<Map<String, Object>> list;
        if (tc != null && !tc.isBlank()) {
            list = mockTaxpayerAdapter.getTaxpayersForTaxCenter(tc);
        } else if (region != null && !region.isBlank()) {
            list = mockTaxpayerAdapter.getTaxpayersForRegion(region);
        } else {
            list = mockTaxpayerAdapter.getTaxpayersForTaxCenter(null);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("data", list);
        response.put("error", null);
        response.put("meta", Map.of("count", list.size(), "page", page, "limit", limit));
        return ResponseEntity.ok(response);
    }
}
