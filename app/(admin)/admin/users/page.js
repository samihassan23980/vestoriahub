"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Plus,
  Filter,
  MoreVertical,
  ShieldCheck,
  ShieldAlert,
  Mail,
  UserCheck,
  UserX,
  Clock,
  Lock,
  Edit,
  Trash2,
  Key,
} from "lucide-react";

const UsersPage = () => {
  // ─── DUMMY DATA (Mapped exactly to UserSchema) ───────────────────────────

  const users = [
    {
      _id: "usr_001",
      name: "John Doe",
      email: "john@sociantech.com",
      role: "super_admin",
      status: "active",
      emailVerified: true,
      lastLoginAt: "2026-04-20T04:30:00Z",
      loginAttempts: 0,
      lockoutUntil: null,
      avatarUrl: "",
    },
    {
      _id: "usr_002",
      name: "Sarah Smith",
      email: "sarah@sociantech.com",
      role: "admin",
      status: "active",
      emailVerified: true,
      lastLoginAt: "2026-04-19T14:15:00Z",
      loginAttempts: 0,
      lockoutUntil: null,
      avatarUrl: "https://i.pravatar.cc/150?u=sarah",
    },
    {
      _id: "usr_003",
      name: "Mike Editor",
      email: "mike@sociantech.com",
      role: "editor",
      status: "active",
      emailVerified: false, // Schema logic: requires verification
      lastLoginAt: null,
      loginAttempts: 0,
      lockoutUntil: null,
      avatarUrl: "",
    },
    {
      _id: "usr_004",
      name: "Hacker Bot",
      email: "intruder@gmail.com",
      role: "editor",
      status: "active",
      emailVerified: true,
      lastLoginAt: "2026-04-15T09:00:00Z",
      loginAttempts: 5, // Triggers lockout logic in schema
      lockoutUntil: "2026-04-20T10:00:00Z",
      avatarUrl: "",
    },
    {
      _id: "usr_005",
      name: "Old Staff",
      email: "retired@sociantech.com",
      role: "admin",
      status: "disabled", // Manually deactivated
      emailVerified: true,
      lastLoginAt: "2025-12-01T12:00:00Z",
      loginAttempts: 0,
      lockoutUntil: null,
      avatarUrl: "",
    },
  ];

  // ─── HELPERS ─────────────────────────────────────────────────────────────

  const getRoleBadge = (role) => {
    switch (role) {
      case "super_admin":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1A1340] text-[#F4A836] text-[10px] font-bold uppercase tracking-wider rounded border border-[#F4A836]/30">
            <ShieldCheck size={12} /> Super Admin
          </span>
        );
      case "admin":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#EEEDFE] text-[#2D2380] text-[10px] font-bold uppercase tracking-wider rounded border border-[#E0DEF5]">
            <ShieldAlert size={12} /> Admin
          </span>
        );
      case "editor":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F7F6FF] text-[#7775A0] text-[10px] font-bold uppercase tracking-wider rounded border border-[#E0DEF5]">
            Editor
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (user) => {
    // Priority 1: Check Lockout (Schema: isLockedOut() method logic)
    if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
      return (
        <span className="flex items-center gap-1.5 px-2 py-1 bg-[#FCEBEB] text-[#E24B4A] text-[11px] font-bold rounded shadow-sm border border-[#E24B4A]/20 uppercase tracking-tighter">
          <Lock size={12} /> Locked
        </span>
      );
    }
    // Priority 2: Disabled Status
    if (user.status === "disabled") {
      return (
        <span className="px-2 py-1 bg-[#7775A0]/10 text-[#7775A0] text-[11px] font-bold rounded uppercase tracking-tighter">
          Disabled
        </span>
      );
    }
    // Default: Active
    return (
      <span className="px-2 py-1 bg-[#22B07D]/10 text-[#22B07D] text-[11px] font-bold rounded uppercase tracking-tighter">
        Active
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#F7F6FF] p-6 md:p-8">
      <div className="max-w-[1280px] mx-auto space-y-6">
        {/* ─── PAGE HEADER ─── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-bold text-[#1A1340] leading-tight flex items-center gap-3">
              <Users className="text-[#F4A836]" size={32} strokeWidth={2.5} />
              Users & Permissions
            </h1>
            <p className="text-[#7775A0] text-[16px] mt-1">
              Manage administrative access, roles, and account security.
            </p>
          </div>

          <Link
            href="/admin/users/new"
            className="flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-[#e05520] text-white px-6 py-3 rounded-lg font-bold text-[15px] shadow-sm transition-colors duration-150 ease-out"
          >
            <Plus size={18} strokeWidth={2.5} />
            Create New User
          </Link>
        </div>

        {/* ─── DATA TABLE ─── */}
        <div className="bg-white border border-[#E0DEF5] rounded-xl shadow-[0_2px_12px_rgba(26,19,64,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-[#F7F6FF] text-[#7775A0] text-[12px] uppercase tracking-wider font-semibold border-b border-[#E0DEF5]">
                  <th className="px-6 py-4 w-[30%]">User Profile</th>
                  <th className="px-6 py-4">Role & Verification</th>
                  <th className="px-6 py-4">Security & Login</th>
                  <th className="px-6 py-4 text-center">Account Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0DEF5]">
                {users.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-[#EEEDFE]/40 transition-colors duration-150 group"
                  >
                    {/* User Identity */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#2D2380] border border-[#2D2380]/20 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-bold text-[14px]">
                              {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <p className="text-[#1A1340] font-bold text-[15px] truncate hover:text-[#2D2380] cursor-pointer">
                            {user.name}
                          </p>
                          <div className="flex items-center gap-1.5 text-[#7775A0] text-[13px]">
                            <Mail size={12} />
                            <span className="truncate">{user.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role & Email Verification Status */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-2 pt-1">
                        {getRoleBadge(user.role)}
                        <div className="flex items-center gap-1.5">
                          {user.emailVerified ? (
                            <span className="flex items-center gap-1 text-[#22B07D] text-[11px] font-bold">
                              <UserCheck size={12} /> Verified
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[#FF6B35] text-[11px] font-bold italic">
                              <UserX size={12} /> Pending Verification
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Login Activity (Schema: lastLoginAt & loginAttempts) */}
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[#1A1340] text-[13px] font-medium">
                          <Clock size={14} className="text-[#7775A0]" />
                          {user.lastLoginAt
                            ? new Date(user.lastLoginAt).toLocaleDateString()
                            : "Never Logged In"}
                        </div>
                        {user.loginAttempts > 0 && (
                          <div
                            className={`text-[11px] font-bold ${user.loginAttempts >= 3 ? "text-[#E24B4A]" : "text-[#BA7517]"}`}
                          >
                            {user.loginAttempts} Failed Attempts
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Account Status (Includes Lockout Logic) */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        {getStatusBadge(user)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-2 text-[#7775A0] hover:text-[#2D2380] hover:bg-[#EEEDFE] rounded-lg transition-colors"
                          title="Edit User"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="p-2 text-[#7775A0] hover:text-[#2D2380] hover:bg-[#EEEDFE] rounded-lg transition-colors"
                          title="Reset Password"
                        >
                          <Key size={16} />
                        </button>
                        <button
                          className="p-2 text-[#7775A0] hover:text-[#E24B4A] hover:bg-[#FCEBEB] rounded-lg transition-colors"
                          title="Delete Account"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button className="p-2 text-[#7775A0] hover:text-[#1A1340] hover:bg-[#EEEDFE] rounded-lg transition-colors">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Info */}
          <div className="px-6 py-4 border-t border-[#E0DEF5] bg-white flex items-center justify-between">
            <span className="text-[#7775A0] text-[13px] font-medium flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-[#F4A836]" /> 1 Super
                Admin
              </span>
              <span className="flex items-center gap-1.5">
                <Lock size={14} className="text-[#E24B4A]" /> 1 Account Locked
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
