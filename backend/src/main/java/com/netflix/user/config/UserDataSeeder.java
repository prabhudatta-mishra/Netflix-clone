package com.netflix.user.config;

import com.netflix.user.entity.User;
import com.netflix.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class UserDataSeeder implements ApplicationRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setEmail("admin@netflix.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole("ADMIN");
            admin.setEmailVerified(true);
            admin.setPaymentConfirmed(true);
            admin.setPaymentUpiId("8144517582@axl");
            userRepository.save(admin);
            System.out.println("Seeded admin / admin123");
        } else {
            userRepository.findByUsername("admin").ifPresent(admin -> {
                admin.setEmailVerified(true);
                admin.setPaymentConfirmed(true);
                admin.setPaymentUpiId("8144517582@axl");
                userRepository.save(admin);
            });
        }

        if (!userRepository.existsByUsername("testuser")) {
            User user = new User();
            user.setUsername("testuser");
            user.setEmail("testuser@gmail.com");
            user.setPassword(passwordEncoder.encode("password123"));
            user.setRole("USER");
            user.setEmailVerified(true);
            user.setPaymentConfirmed(true);
            user.setPaymentUpiId("8144517582@axl");
            userRepository.save(user);
            System.out.println("Seeded testuser / password123");
        } else {
            userRepository.findByUsername("testuser").ifPresent(user -> {
                user.setEmailVerified(true);
                user.setPaymentConfirmed(true);
                user.setPaymentUpiId("8144517582@axl");
                userRepository.save(user);
            });
        }
    }
}
