"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button, Input, Card, Spinner, Alert } from "../../components/ui";
import { trendingKeywordsService } from "../../lib/trendingKeywords";
import { ROUTES } from "../../lib/constants";

export default function TrendingKeywordsAdminPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);

  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [word, setWord] = useState("");
  const [boost, setBoost] = useState("25");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || authLoading) return;

    if (!isAuthenticated || user?.role !== "admin") {
      router.push(ROUTES.DASHBOARD);
      return;
    }

    loadKeywords();
  }, [mounted, authLoading, isAuthenticated, user, router]);

  const loadKeywords = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await trendingKeywordsService.list();
      setKeywords(res.keywords || []);
    } catch (err) {
      setError(err.message || "Failed to load trending keywords");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!word.trim()) return;

    setSubmitting(true);
    setError("");
    try {
      await trendingKeywordsService.create(
        word.trim(),
        boost ? Number(boost) : undefined,
      );
      setWord("");
      setBoost("25");
      await loadKeywords();
    } catch (err) {
      setError(err.message || "Failed to add keyword");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (keyword) => {
    setError("");
    try {
      await trendingKeywordsService.update(keyword._id, {
        isActive: !keyword.isActive,
      });
      await loadKeywords();
    } catch (err) {
      setError(err.message || "Failed to update keyword");
    }
  };

  const handleDelete = async (keyword) => {
    setError("");
    try {
      await trendingKeywordsService.remove(keyword._id);
      setKeywords((prev) => prev.filter((k) => k._id !== keyword._id));
    } catch (err) {
      setError(err.message || "Failed to delete keyword");
    }
  };

  if (!mounted || authLoading || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#030303] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#030303] px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Trending Keywords
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Words added here boost matching stories in the trending
            algorithm. Boost is added to a post&apos;s trending score when
            the word appears in its title, content, or tags.
          </p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError("")} />}

        <Card className="p-4">
          <form onSubmit={handleAdd} className="flex gap-2 items-start">
            <div className="flex-1">
              <Input
                placeholder="e.g. election"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="w-24">
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="Boost"
                value={boost}
                onChange={(e) => setBoost(e.target.value)}
                disabled={submitting}
              />
            </div>
            <Button type="submit" disabled={submitting || !word.trim()}>
              Add
            </Button>
          </form>
        </Card>

        <Card className="divide-y divide-gray-200 dark:divide-gray-800">
          {loading ? (
            <div className="p-6 flex justify-center">
              <Spinner />
            </div>
          ) : keywords.length === 0 ? (
            <div className="p-6 text-sm text-gray-500 dark:text-gray-400 text-center">
              No trending keywords yet. Add one above.
            </div>
          ) : (
            keywords.map((keyword) => (
              <div
                key={keyword._id}
                className="p-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {keyword.word}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Boost: {keyword.boost}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={keyword.isActive}
                      onChange={() => handleToggleActive(keyword)}
                    />
                    Active
                  </label>
                  <button
                    type="button"
                    onClick={() => handleDelete(keyword)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Delete keyword"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
