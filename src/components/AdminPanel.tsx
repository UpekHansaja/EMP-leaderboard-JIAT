"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Team } from "@/types/team";

type MarksState = Record<string, number>;

export function AdminPanel() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [message, setMessage] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [markDrafts, setMarkDrafts] = useState<MarksState>({});
  const [loadingTeams, setLoadingTeams] = useState(false);

  const sortedTeams = useMemo(
    () => [...teams].sort((a, b) => b.teamMark - a.teamMark || a.teamName.localeCompare(b.teamName)),
    [teams]
  );
  const totalTeamMarks = useMemo(
    () => teams.reduce((total, team) => total + team.teamMark, 0),
    [teams]
  );

  const loadTeams = async () => {
    setLoadingTeams(true);
    setMessage("");
    try {
      const response = await fetch("/api/teams", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to fetch teams.");
      const data = (await response.json()) as Team[];
      setTeams(data);
      setMarkDrafts(
        data.reduce<MarksState>((acc, team) => {
          acc[team._id] = 0;
          return acc;
        }, {})
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load teams.");
    } finally {
      setLoadingTeams(false);
    }
  };

  useEffect(() => {
    // Keep admin UX simple: start with login form immediately.
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadTeams().catch(() => {
        setMessage("Unable to load teams.");
      });
    }
  }, [isAuthenticated]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const payload = (await response.json()) as { message?: string };
    if (!response.ok) {
      setMessage(payload.message || "Login failed.");
      return;
    }

    setMessage("Login successful.");
    setPassword("");
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setIsAuthenticated(false);
    setTeams([]);
    setMessage("Logged out.");
  };

  const handleUpdateMark = async (teamId: string) => {
    setMessage("");
    const markDelta = Number(markDrafts[teamId]);
    if (!Number.isFinite(markDelta)) {
      setMessage("Mark adjustment must be a valid number.");
      return;
    }

    const response = await fetch(`/api/teams/${teamId}/marks`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markDelta }),
    });

    const payload = (await response.json()) as { message?: string; teamMark?: number };
    if (!response.ok) {
      setMessage(payload.message || "Failed to update mark.");
      return;
    }

    setTeams((prev) =>
      prev.map((team) =>
        team._id === teamId ? { ...team, teamMark: payload.teamMark ?? team.teamMark } : team
      )
    );
    setMarkDrafts((prev) => ({ ...prev, [teamId]: 0 }));
    setMessage("Team marks adjusted.");
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    const shouldDelete = window.confirm(`Delete team "${teamName}"? This action cannot be undone.`);
    if (!shouldDelete) return;

    setMessage("");
    const response = await fetch(`/api/teams/${teamId}`, { method: "DELETE" });
    const payload = (await response.json()) as { message?: string };
    if (!response.ok) {
      setMessage(payload.message || "Failed to delete team.");
      return;
    }

    setTeams((prev) => prev.filter((team) => team._id !== teamId));
    setMarkDrafts((prev) => {
      const next = { ...prev };
      delete next[teamId];
      return next;
    });
    setMessage(payload.message || "Team deleted.");
  };

  if (!isAuthenticated) {
    return (
      <section className="mx-auto w-full max-w-md px-4 py-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
          <p className="text-xs uppercase tracking-[0.25em] text-indigo-600">Admin Login</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Leadboard Admin</h1>
          <p className="mt-2 text-sm text-slate-600">Login to update team marks individually.</p>

          <form className="mt-5 grid gap-3" onSubmit={handleLogin}>
            <label className="grid gap-1 text-sm">
              Username
              <input
                className="rounded-xl border border-slate-300 p-3"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="jiat.emp.com"
              />
            </label>

            <label className="grid gap-1 text-sm">
              Password
              <input
                type="password"
                className="rounded-xl border border-slate-300 p-3"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
              />
            </label>

            <button type="submit" className="mt-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white">
              Login
            </button>
          </form>

          {message && <p className="mt-3 text-sm text-rose-600">{message}</p>}
          <Link href="/" className="mt-4 inline-block text-sm text-indigo-700">
            Go back to leaderboard
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-indigo-600">Admin Console</p>
          <h1 className="text-3xl font-bold text-slate-900">Update Team Marks</h1>
          <p className="mt-1 text-sm text-slate-600">
            Total team marks: <span className="font-semibold text-slate-900">{totalTeamMarks}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700">
            View Leadboard
          </Link>
          <button onClick={handleLogout} className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white">
            Logout
          </button>
        </div>
      </div>

      {message && <p className="mb-4 text-sm text-slate-700">{message}</p>}

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-md">
        {loadingTeams ? (
          <p className="text-sm text-slate-600">Loading teams...</p>
        ) : sortedTeams.length === 0 ? (
          <p className="text-sm text-slate-600">No teams available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                  <th className="py-3">Team</th>
                  <th className="py-3">Leader</th>
                  <th className="py-3">Current Mark</th>
                  <th className="py-3">Adjust Mark (+ / -)</th>
                  <th className="py-3">New Total</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedTeams.map((team) => (
                  <tr key={team._id} className="border-b border-slate-100">
                    <td className="py-3 font-medium text-slate-900">{team.teamName}</td>
                    <td className="py-3 text-slate-700">{team.leader.fullName}</td>
                    <td className="py-3 text-indigo-700">{team.teamMark}</td>
                    <td className="py-3">
                      <input
                        type="number"
                        value={markDrafts[team._id] ?? 0}
                        onChange={(e) =>
                          setMarkDrafts((prev) => ({
                            ...prev,
                            [team._id]: Number(e.target.value),
                          }))
                        }
                        className="w-32 rounded-xl border border-slate-300 p-2"
                        placeholder="e.g. -50 or 300"
                      />
                    </td>
                    <td className="py-3">
                      <span className="font-semibold text-slate-800">
                        {team.teamMark + (markDrafts[team._id] ?? 0)}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateMark(team._id)}
                        className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
                      >
                        Apply
                      </button>
                        <button
                          onClick={() => handleDeleteTeam(team._id, team.teamName)}
                          className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
