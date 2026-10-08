package com.agrivision.specification;

import com.agrivision.entity.CropType;
import com.agrivision.entity.FieldParcel;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class FieldParcelSpecification {

    public static Specification<FieldParcel> filter(
            UUID studyAreaId,
            CropType cropClass,
            Double minAreaHa,
            Double maxAreaHa,
            Double minNdvi,
            String searchQuery) {
        return filter(studyAreaId, cropClass, minAreaHa, maxAreaHa, minNdvi, null, null, searchQuery);
    }

    public static Specification<FieldParcel> filter(
            UUID studyAreaId,
            CropType cropClass,
            Double minAreaHa,
            Double maxAreaHa,
            Double minNdvi,
            Double minConfidence,
            Double maxConfidence,
            String searchQuery) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (studyAreaId != null) {
                predicates.add(cb.equal(root.get("studyArea").get("id"), studyAreaId));
            }

            if (cropClass != null) {
                predicates.add(cb.equal(root.get("cropClass"), cropClass));
            }

            if (minAreaHa != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("areaHa"), minAreaHa));
            }

            if (maxAreaHa != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("areaHa"), maxAreaHa));
            }

            if (minNdvi != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("meanNdvi"), minNdvi));
            }

            if (minConfidence != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("confidence"), minConfidence));
            }

            if (maxConfidence != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("confidence"), maxConfidence));
            }

            if (searchQuery != null && !searchQuery.trim().isEmpty()) {
                String pattern = "%" + searchQuery.trim().toLowerCase() + "%";
                Predicate segmentMatch = cb.like(cb.lower(root.get("segmentId")), pattern);
                Predicate talukMatch = cb.like(cb.lower(root.get("taluk")), pattern);
                Predicate villageMatch = cb.like(cb.lower(root.get("village")), pattern);
                predicates.add(cb.or(segmentMatch, talukMatch, villageMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
