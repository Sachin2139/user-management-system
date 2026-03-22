package com.example.usermanagement.specification;

import com.example.usermanagement.entity.User;
import org.springframework.data.jpa.domain.Specification;

public class UserSpecifications {

    public static Specification<User> hasName(String name) {
        return (root, query, cb) ->
                cb.like(cb.lower(root.get("name")), "%" + name.toLowerCase() + "%");
    }

    public static Specification<User> hasUsername(String username) {
        return (root, query, cb) ->
                cb.like(cb.lower(root.get("username")), "%" + username.toLowerCase() + "%");
    }

    public static Specification<User> hasEmail(String email) {
        return (root, query, cb) ->
                cb.equal(cb.lower(root.get("email")), email.toLowerCase());
    }

    public static Specification<User> hasRole(String role) {
        return (root, query, cb) ->
                cb.equal(cb.lower(root.get("role")), role.toLowerCase());
    }

    public static Specification<User> hasStatus(Boolean status) {
        return (root, query, cb) ->
                cb.equal(root.get("status"), status);
    }
}