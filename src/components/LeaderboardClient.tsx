"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import type { Team } from "@/types/team";

export function LeaderboardClient() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const cardsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/teams", { cache: "no-store" });
        if (!response.ok) {
          const payload = (await response.json()) as { message?: string };
          throw new Error(payload.message || "Failed to load leaderboard.");
        }

        const data = (await response.json()) as Team[];
        setTeams(data);
        setError("");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load leaderboard.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeams();
  }, []);

  useEffect(() => {
    if (!cardsRef.current) {
      return;
    }

    const cards = cardsRef.current.querySelectorAll("[data-card]");
    gsap.fromTo(
      cards,
      { opacity: 0, y: 20, scale: 0.98 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.55,
        stagger: 0.08,
        ease: "power3.out",
      },
    );
  }, [teams, isLoading]);

  const topThree = useMemo(() => teams.slice(0, 3), [teams]);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8">
      <header className="grid gap-4 rounded-3xl border border-white/20 bg-gradient-to-br from-slate-950 to-indigo-900 p-6 text-white shadow-2xl sm:grid-cols-[1fr_auto]">
        <div>
          {/* <p className="uppercase bg-indigo-200"> */}
            <Image
              src={`jiat-grayscale.png`}
              alt={`jiat logo`}
              width={240}
              height={500}
              objectFit="contain"
              className="rounded-xl object-cover"
              unoptimized
            />
          {/* </p> */}
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl ps-2">EMP Team Leaderboard</h1>
          {/* <p className="mt-2 text-sm text-indigo-100">
            Track top-performing teams and register new challengers in seconds.
          </p> */}
        </div>
        <div className="flex items-center justify-center flex-wrap gap-3 sm:justify-end">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:scale-[1.02]"
          >
            Register New Team
          </Link>
          {/* <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-2xl border border-white/70 px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.02]"
          >
            Admin Login
          </Link> */}
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3" ref={cardsRef}>
        {topThree.map((team, index) => (
          <article
            key={team._id}
            data-card
            className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-lg backdrop-blur"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Top {index + 1}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Image
                src={team.teamLogo}
                alt={`${team.teamName} logo`}
                width={48}
                height={48}
                className="h-12 w-12 rounded-xl object-cover"
                unoptimized
              />
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {team.teamName}
                </h2>
                <p className="text-xs text-slate-600">{team.teamSlogan}</p>
              </div>
            </div>
            <p className="mt-6 text-3xl font-bold text-indigo-700">
              {team.teamMark} pts
            </p>
          </article>
        ))}
      </div>

      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md">
        <h3 className="text-lg font-semibold text-slate-900">All Teams</h3>
        {isLoading && (
          <p className="mt-3 text-sm text-slate-500">Loading leaderboard...</p>
        )}
        {!isLoading && error && (
          <p className="mt-3 text-sm text-rose-600">{error}</p>
        )}
        {!isLoading && !error && teams.length === 0 && (
          <p className="mt-3 text-sm text-slate-600">
            No teams yet. Register your first team.
          </p>
        )}
        {!isLoading && !error && teams.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                  <th className="py-3">Rank</th>
                  <th className="py-3">Team</th>
                  <th className="py-3">Leader</th>
                  <th className="py-3">Members</th>
                  <th className="py-3">Mark</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team, index) => (
                  <tr key={team._id} className="border-b border-slate-100">
                    <td className="py-3 font-semibold text-slate-700">
                      #{index + 1}
                    </td>
                    <td className="py-3 text-slate-800">{team.teamName}</td>
                    <td className="py-3 text-slate-700">
                      {team.leader.fullName}
                    </td>
                    <td className="py-3 text-slate-700">
                      {team.members.length + 1}
                    </td>
                    <td className="py-3 font-semibold text-indigo-700">
                      {team.teamMark}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}
