package com.example.usermanagement.controller;

import com.example.usermanagement.entity.User;
import com.example.usermanagement.repository.UserRepository;
import com.example.usermanagement.specification.UserSpecifications;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public Page<User> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        return userRepository.findAll(pageable);
    }

    @GetMapping("/count")
    public long countUsers() {
        return userRepository.count();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body("User not found with id: " + id);
        }
        return ResponseEntity.ok(userOpt.get());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.status(404).body("User not found");
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok("User deleted");
    }

    // Simple create – database auto‑generates ID
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody User user) {
        User savedUser = userRepository.save(user);
        return ResponseEntity.ok(savedUser);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User incoming) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body("User not found with this id : " + id);
        }

        User existing = userOpt.get();
        if (incoming.getName() != null) existing.setName(incoming.getName());
        if (incoming.getUsername() != null) existing.setUsername(incoming.getUsername());
        if (incoming.getEmail() != null) existing.setEmail(incoming.getEmail());
        if (incoming.getPhone() != null) existing.setPhone(incoming.getPhone());
        if (incoming.getRole() != null) existing.setRole(incoming.getRole());
        if (incoming.getStatus() != null) existing.setStatus(incoming.getStatus());
        if (incoming.getPassword() != null) existing.setPassword(incoming.getPassword());

        User saved = userRepository.save(existing);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/filter")
    public ResponseEntity<Page<User>> filterUsers(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Specification<User> spec = Specification.where(null);

        if (name != null && !name.isEmpty()) {
            spec = spec.and(UserSpecifications.hasName(name));
        }
        if (username != null && !username.isEmpty()) {
            spec = spec.and(UserSpecifications.hasUsername(username));
        }
        if (email != null && !email.isEmpty()) {
            spec = spec.and(UserSpecifications.hasEmail(email));
        }
        if (role != null && !role.isEmpty()) {
            spec = spec.and(UserSpecifications.hasRole(role));
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<User> result = userRepository.findAll(spec, pageable);
        return ResponseEntity.ok(result);
    }
}