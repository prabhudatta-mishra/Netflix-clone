package com.netflix.user.service;

import com.netflix.user.dto.AuthResponse;
import com.netflix.user.dto.LoginRequest;
import com.netflix.user.dto.RegisterRequest;
import com.netflix.user.entity.User;
import com.netflix.user.repository.UserRepository;
import com.netflix.user.security.CustomUserDetailsService;
import com.netflix.user.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private static final String MEMBERSHIP_UPI_ID = "8144517582@axl";

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${app.mail.from:no-reply@netflix-clone.local}")
    private String mailFrom;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }
        if (!Boolean.TRUE.equals(request.getEmailVerified())) {
            throw new RuntimeException("Please verify your email before creating the account.");
        }
        if (!Boolean.TRUE.equals(request.getPaymentConfirmed())) {
            throw new RuntimeException("Please complete payment before creating the account.");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("USER");
        user.setEmailVerified(true);
        user.setPaymentConfirmed(true);
        user.setPaymentUpiId(request.getPaymentUpiId() != null ? request.getPaymentUpiId() : MEMBERSHIP_UPI_ID);
        userRepository.save(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        String token = jwtUtil.generateToken(userDetails, user.getRole());

        return new AuthResponse(token, user.getUsername(), user.getEmail(), user.getRole(),
                user.getEmailVerified(), user.getPaymentConfirmed(), "Registration successful!");
    }

    public AuthResponse login(LoginRequest request) {
        String login = request.getUsername();
        String authUsername = userRepository.findByUsername(login)
                .or(() -> userRepository.findByEmail(login))
                .map(User::getUsername)
                .orElse(login);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(authUsername, request.getPassword()));

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!"ADMIN".equalsIgnoreCase(user.getRole())) {
            if (!Boolean.TRUE.equals(user.getEmailVerified())) {
                throw new RuntimeException("Please verify your email before signing in.");
            }
            if (!Boolean.TRUE.equals(user.getPaymentConfirmed())) {
                throw new RuntimeException("Please complete payment before signing in.");
            }
        }

        String token = jwtUtil.generateToken(userDetails, user.getRole());
        return new AuthResponse(token, user.getUsername(), user.getEmail(), user.getRole(),
                user.getEmailVerified(), user.getPaymentConfirmed(), "Login successful!");
    }

    public String sendVerificationLink(String email) {
        if (email == null || email.isBlank()) {
            throw new RuntimeException("Email is required");
        }
        String link = frontendUrl + "/register?email=" + email + "&verified=true";
        if (mailSender == null || mailUsername == null || mailUsername.isBlank()) {
            return "SMTP is not configured. Demo verification link: " + link;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(email);
        message.setSubject("Verify your Netflix Clone email");
        message.setText("Welcome to Netflix Clone.\n\nClick this link to verify your email:\n" + link
                + "\n\nIf you did not request this, ignore this email.");
        mailSender.send(message);
        return "Verification email sent to " + email;
    }
}
