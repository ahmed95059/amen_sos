#!/usr/bin/env tsx
/**
 * RBAC Validation Test
 * Validates that all roles have correct permissions according to specification
 */

import { UserRole, getPermissions, roleDisplayNames } from './src/types/index';

interface RBACTest {
  role: UserRole;
  description: string;
  expectedPermissions: Record<keyof ReturnType<typeof getPermissions>, boolean | string>;
}

const rbacTests: RBACTest[] = [
  {
    role: 'normal',
    description: 'Normal user (mother, aunt, educator, driver)',
    expectedPermissions: {
      canCreateProfileSignature: true,
      canCreateTicket: true,
      canViewOwnTicket: true,
      canViewVillageCases: false,
      canViewAllVillagesCases: false,
      canWriteReports: false,
      canViewReports: false,
      canViewFileAndDPE: false,
      canApproveActionPlan: false,
      canCloseCase: false,
      canViewNationalAnalytics: false,
      canManageUsers: false,
      canReceiveNotifications: true,
      sensitiveContentAccess: 'none',
    },
  },
  {
    role: 'psychologue',
    description: 'Psychologist',
    expectedPermissions: {
      canCreateProfileSignature: true,
      canCreateTicket: true,
      canViewOwnTicket: true,
      canViewVillageCases: true,
      canViewAllVillagesCases: false,
      canWriteReports: true,
      canViewReports: true,
      canViewFileAndDPE: true,
      canApproveActionPlan: false,
      canCloseCase: false,
      canViewNationalAnalytics: false,
      canManageUsers: false,
      canReceiveNotifications: true,
      sensitiveContentAccess: 'full_assigned',
    },
  },
  {
    role: 'dir_village',
    description: 'Village Director',
    expectedPermissions: {
      canCreateProfileSignature: true,
      canCreateTicket: true,
      canViewOwnTicket: true,
      canViewVillageCases: true,
      canViewAllVillagesCases: false,
      canWriteReports: false,
      canViewReports: true,
      canViewFileAndDPE: true,
      canApproveActionPlan: true,
      canCloseCase: false,
      canViewNationalAnalytics: false,
      canManageUsers: false,
      canReceiveNotifications: true,
      sensitiveContentAccess: 'limited',
    },
  },
  {
    role: 'responsable_save',
    description: 'Responsable Sauvegarde (Protection Officer)',
    expectedPermissions: {
      canCreateProfileSignature: true,
      canCreateTicket: true,
      canViewOwnTicket: true,
      canViewVillageCases: true,
      canViewAllVillagesCases: true,
      canWriteReports: false,
      canViewReports: true,
      canViewFileAndDPE: true,
      canApproveActionPlan: true,
      canCloseCase: false,
      canViewNationalAnalytics: false,
      canManageUsers: false,
      canReceiveNotifications: true,
      sensitiveContentAccess: 'none',
    },
  },
  {
    role: 'dir_national',
    description: 'National Director',
    expectedPermissions: {
      canCreateProfileSignature: true,
      canCreateTicket: false,
      canViewOwnTicket: false,
      canViewVillageCases: false,
      canViewAllVillagesCases: false,
      canWriteReports: false,
      canViewReports: false,
      canViewFileAndDPE: false,
      canApproveActionPlan: false,
      canCloseCase: false,
      canViewNationalAnalytics: true,
      canManageUsers: false,
      canReceiveNotifications: false,
      sensitiveContentAccess: 'none',
    },
  },
  {
    role: 'admin_it',
    description: 'IT Administrator (technical admin only)',
    expectedPermissions: {
      canCreateProfileSignature: true,
      canCreateTicket: false,
      canViewOwnTicket: false,
      canViewVillageCases: false,
      canViewAllVillagesCases: false,
      canWriteReports: false,
      canViewReports: false,
      canViewFileAndDPE: false,
      canApproveActionPlan: false,
      canCloseCase: false,
      canViewNationalAnalytics: false,
      canManageUsers: true,
      canReceiveNotifications: false,
      sensitiveContentAccess: 'none',
    },
  },
];

// Run tests
console.log('╔════════════════════════════════════════════════════════╗');
console.log('║           RBAC PERMISSIONS VALIDATION TEST              ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

rbacTests.forEach((test) => {
  console.log(`\n📋 Testing: ${roleDisplayNames[test.role]}`);
  console.log(`   Description: ${test.description}`);
  console.log('   ─────────────────────────────────────────────────────');

  const actualPermissions = getPermissions(test.role);

  const permissionKeys = Object.keys(
    test.expectedPermissions
  ) as (keyof ReturnType<typeof getPermissions>)[];

  let rolePassed = true;

  permissionKeys.forEach((key) => {
    totalTests++;
    const expected = test.expectedPermissions[key];
    const actual = actualPermissions[key];
    const passed = expected === actual;

    if (passed) {
      passedTests++;
      console.log(`   ✅ ${key}: ${actual}`);
    } else {
      failedTests++;
      rolePassed = false;
      console.log(
        `   ❌ ${key}: expected ${expected}, got ${actual}`
      );
    }
  });

  if (rolePassed) {
    console.log(`\n   🎉 ${test.role} permissions are CORRECT\n`);
  } else {
    console.log(`\n   💥 ${test.role} permissions have ERRORS\n`);
  }
});

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║                    TEST SUMMARY                         ║');
console.log('╚════════════════════════════════════════════════════════╝');
console.log(`Total Permission Tests: ${totalTests}`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

if (failedTests === 0) {
  console.log('✨ All RBAC tests PASSED! ✨\n');
  process.exit(0);
} else {
  console.log('⚠️  Some RBAC tests FAILED! ⚠️\n');
  process.exit(1);
}
