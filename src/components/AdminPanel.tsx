"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { PersonInfo, Team } from "@/types/team";

type MarksState = Record<string, number>;
type EditableTeam = Pick<Team, "_id" | "teamName" | "teamLogo" | "teamSlogan" | "leader" | "members">;
const EMPTY_PERSON: PersonInfo = { fullName: "", nic: "", contactNo: "", email: "" };

export function AdminPanel() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [message, setMessage] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [markDrafts, setMarkDrafts] = useState<MarksState>({});
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<EditableTeam | null>(null);
  const [isSavingTeam, setIsSavingTeam] = useState(false);

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

  const openTeamModal = (team: Team) => {
    setSelectedTeam({
      _id: team._id,
      teamName: team.teamName,
      teamLogo: team.teamLogo,
      teamSlogan: team.teamSlogan,
      leader: { ...team.leader },
      members: team.members.map((member) => ({ ...member })),
    });
    setMessage("");
  };

  const openCreateTeamModal = () => {
    setSelectedTeam({
      _id: "new",
      teamName: "",
      teamLogo: "",
      teamSlogan: "",
      leader: { ...EMPTY_PERSON },
      members: Array.from({ length: 7 }, () => ({ ...EMPTY_PERSON })),
    });
    setMessage("");
  };

  const updateSelectedPerson = (
    target: "leader" | "member",
    key: keyof PersonInfo,
    value: string,
    memberIndex?: number
  ) => {
    if (!selectedTeam) return;

    if (target === "leader") {
      setSelectedTeam({ ...selectedTeam, leader: { ...selectedTeam.leader, [key]: value } });
      return;
    }

    if (memberIndex === undefined) return;
    const nextMembers = selectedTeam.members.map((member, index) =>
      index === memberIndex ? { ...member, [key]: value } : member
    );
    setSelectedTeam({ ...selectedTeam, members: nextMembers });
  };

  const addMemberToSelectedTeam = () => {
    if (!selectedTeam) return;
    if (selectedTeam.members.length >= 7) {
      setMessage("A team can only have 7 members (plus leader).");
      return;
    }
    setSelectedTeam({ ...selectedTeam, members: [...selectedTeam.members, { ...EMPTY_PERSON }] });
  };

  const removeMemberFromSelectedTeam = (memberIndex: number) => {
    if (!selectedTeam) return;
    const nextMembers = selectedTeam.members.filter((_, index) => index !== memberIndex);
    setSelectedTeam({ ...selectedTeam, members: nextMembers });
  };

  const saveSelectedTeam = async () => {
    if (!selectedTeam) return;
    setMessage("");

    if (selectedTeam.members.length > 7) {
      setMessage("A team can have at most 7 members (plus leader).");
      return;
    }

    const allPeople = [selectedTeam.leader, ...selectedTeam.members];
    const hasEmptyField = allPeople.some((person) => Object.values(person).some((value) => !value.trim()));
    if (hasEmptyField || !selectedTeam.teamName.trim() || !selectedTeam.teamLogo.trim() || !selectedTeam.teamSlogan.trim()) {
      setMessage("Please complete all team, leader and member fields before saving.");
      return;
    }

    setIsSavingTeam(true);
    let response;
    let payload;

    if (selectedTeam._id === "new") {
      const { _id, ...teamData } = selectedTeam;
      response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teamData),
      });
      payload = await response.json();
    } else {
      response = await fetch(`/api/teams/${selectedTeam._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedTeam),
      });
      payload = await response.json();
    }
    
    setIsSavingTeam(false);

    if (!response.ok) {
      setMessage(payload.message || "Failed to save team details.");
      return;
    }

    if (selectedTeam._id === "new") {
      setTeams((prev) => [...prev, payload]);
      setMarkDrafts((prev) => ({ ...prev, [payload._id]: 0 }));
    } else {
      setTeams((prev) => prev.map((team) => (team._id === selectedTeam._id ? { ...team, ...payload } : team)));
    }
    
    setSelectedTeam(null);
    setMessage(selectedTeam._id === "new" ? "Team created successfully." : "Team details updated successfully.");
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
          <button onClick={openCreateTeamModal} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            Create Team
          </button>
          <Link href="/" className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
            View Leadboard
          </Link>
          <button onClick={handleLogout} className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800">
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
                    <td className="py-3 font-medium text-slate-900">
                      <button
                        onClick={() => openTeamModal(team)}
                        className="rounded-lg px-2 py-1 text-left text-indigo-700 hover:bg-indigo-50"
                      >
                        {team.teamName}
                      </button>
                    </td>
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
                          onClick={() => openTeamModal(team)}
                          className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"
                        >
                          Manage
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

      {selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm transition-opacity">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white/95 shadow-2xl ring-1 ring-slate-900/5 backdrop-blur-md">
            <header className="flex flex-shrink-0 items-center justify-between border-b border-slate-200/60 bg-slate-50/50 px-6 py-4 backdrop-blur-md">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                  {selectedTeam._id === "new" ? "Create New Team" : "Manage Team"}
                </h2>
                <p className="text-sm font-medium text-indigo-600">
                  {selectedTeam._id === "new" ? "Fill out the details below" : selectedTeam.teamName}
                </p>
              </div>
              <button
                onClick={() => setSelectedTeam(null)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-6 scroll-smooth">
              <section className="mb-8">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">Team Details</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="group flex flex-col gap-1 text-sm font-medium text-slate-700">
                    Team Name
                    <input
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      value={selectedTeam.teamName}
                      onChange={(e) => setSelectedTeam({ ...selectedTeam, teamName: e.target.value })}
                    />
                  </label>
                  <label className="group flex flex-col gap-1 text-sm font-medium text-slate-700">
                    Team Slogan
                    <input
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      value={selectedTeam.teamSlogan}
                      onChange={(e) => setSelectedTeam({ ...selectedTeam, teamSlogan: e.target.value })}
                    />
                  </label>
                  <label className="group flex flex-col gap-1 text-sm font-medium text-slate-700 md:col-span-2">
                    Team Logo URL (Or Base64)
                    <input
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      value={selectedTeam.teamLogo}
                      onChange={(e) => setSelectedTeam({ ...selectedTeam, teamLogo: e.target.value })}
                    />
                  </label>
                </div>
              </section>

              <section className="mb-8 rounded-2xl border border-indigo-100 bg-indigo-50/30 p-5">
                <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-800">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs text-white">L</span>
                  Leader Details
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {(["fullName", "nic", "contactNo", "email"] as const).map((fieldKey) => (
                    <label key={`leader-${fieldKey}`} className="flex flex-col gap-1 text-sm font-medium capitalize text-slate-700">
                      {fieldKey.replace(/([A-Z])/g, ' $1').trim()}
                      <input
                        className="rounded-xl border border-white/60 bg-white/70 px-4 py-2.5 shadow-sm outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200"
                        value={selectedTeam.leader[fieldKey]}
                        onChange={(e) => updateSelectedPerson("leader", fieldKey, e.target.value)}
                      />
                    </label>
                  ))}
                </div>
              </section>

              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Team Members <span className="ml-2 inline-flex items-center justify-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{selectedTeam.members.length}/7</span>
                  </h3>
                  <button
                    onClick={addMemberToSelectedTeam}
                    disabled={selectedTeam.members.length >= 7}
                    className="flex items-center gap-1 rounded-xl bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 disabled:opacity-50"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Member
                  </button>
                </div>

                <div className="space-y-4">
                  {selectedTeam.members.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-8 text-center">
                      <p className="text-sm text-slate-500">No other team members yet.</p>
                      <p className="text-xs text-slate-400">Click &apos;Add Member&apos; to include more teammates.</p>
                    </div>
                  )}
                  {selectedTeam.members.map((member, memberIndex) => (
                    <div key={`member-${memberIndex}`} className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 transition-colors group-hover:bg-indigo-100 group-hover:text-indigo-700">
                            {memberIndex + 1}
                          </span>
                          <p className="text-sm font-semibold text-slate-800">Member Info</p>
                        </div>
                        <button
                          onClick={() => removeMemberFromSelectedTeam(memberIndex)}
                          className="flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-100"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Remove
                        </button>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        {(["fullName", "nic", "contactNo", "email"] as const).map((fieldKey) => (
                          <label key={`${memberIndex}-${fieldKey}`} className="flex flex-col gap-1 text-sm font-medium capitalize text-slate-700">
                            {fieldKey.replace(/([A-Z])/g, ' $1').trim()}
                            <input
                              className="rounded-xl border border-slate-200 px-4 py-2.5 outline-none transition-all hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                              value={member[fieldKey]}
                              onChange={(e) =>
                                updateSelectedPerson("member", fieldKey, e.target.value, memberIndex)
                              }
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <footer className="flex flex-shrink-0 items-center justify-end gap-3 border-t border-slate-200/60 bg-slate-50/80 px-6 py-4 backdrop-blur-md">
              <button
                onClick={() => setSelectedTeam(null)}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={saveSelectedTeam}
                disabled={isSavingTeam}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition-all hover:from-emerald-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
              >
                {isSavingTeam ? (
                  <>
                    <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>Save Team</>
                )}
              </button>
            </footer>
          </div>
        </div>
      )}
    </section>
  );
}
