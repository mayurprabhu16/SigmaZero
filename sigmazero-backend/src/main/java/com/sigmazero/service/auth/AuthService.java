package com.sigmazero.service.auth;

import com.sigmazero.domain.entity.Account;
import com.sigmazero.domain.entity.AppUser;
import com.sigmazero.domain.entity.Tenant;
import com.sigmazero.domain.enums.AccountType;
import com.sigmazero.dto.request.LoginRequest;
import com.sigmazero.dto.request.RegisterRequest;
import com.sigmazero.dto.response.AuthResponse;
import com.sigmazero.repository.AccountRepository;
import com.sigmazero.repository.AppUserRepository;
import com.sigmazero.repository.TenantRepository;
import com.sigmazero.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final AppUserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("An account already exists for this email.");
        }

        Tenant tenant = tenantRepository.save(Tenant.builder()
                .name(request.organizationName().trim())
                .build());

        AppUser user = userRepository.save(AppUser.builder()
                .tenant(tenant)
                .email(email)
                .passwordHash(passwordEncoder.encode(request.password()))
                .role("ADMIN")
                .active(true)
                .build());

        provisionDefaultAccounts(tenant);
        return createResponse(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase();
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.password()));
        AppUserPrincipalAdapter principal = new AppUserPrincipalAdapter(authentication);
        AppUser user = userRepository.findById(principal.userId())
                .orElseThrow(() -> new IllegalArgumentException("User account not found."));
        return createResponse(user);
    }

    private AuthResponse createResponse(AppUser user) {
        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getTenant().getId(), user.getRole());
        return new AuthResponse(token,
                new AuthResponse.UserInfo(user.getId(), user.getEmail(), user.getRole()),
                new AuthResponse.TenantInfo(user.getTenant().getId(), user.getTenant().getName()));
    }

    private void provisionDefaultAccounts(Tenant tenant) {
        List<Account> accounts = List.of(
                account(tenant, "1000", "Cash & Operational Bank", AccountType.ASSET),
                account(tenant, "1100", "Accounts Receivable", AccountType.ASSET),
                account(tenant, "2000", "Accounts Payable", AccountType.LIABILITY),
                account(tenant, "3000", "Owner Equity", AccountType.EQUITY),
                account(tenant, "4000", "Primary Revenue", AccountType.REVENUE),
                account(tenant, "5000", "Operating Expense", AccountType.EXPENSE)
        );
        accountRepository.saveAll(accounts);
    }

    private Account account(Tenant tenant, String code, String name, AccountType type) {
        return Account.builder().tenant(tenant).code(code).name(name).type(type).currency("USD").isActive(true).build();
    }

    private record AppUserPrincipalAdapter(Authentication authentication) {
        java.util.UUID userId() {
            com.sigmazero.security.AppUserPrincipal p = (com.sigmazero.security.AppUserPrincipal) authentication.getPrincipal();
            return p.userId();
        }
    }
}
