'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
// lucide v1 dropped brand marks, so the GitHub logo is inlined here.
import { GithubMark } from '@/components/ui/github-mark';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge, Card, CardBody, CardHeader, CardTitle, Field, Input } from '@/components/ui/primitives';
import { formatRelative } from '@/lib/utils';

export function GitHubCard() {
  const queryClient = useQueryClient();
  const [repoName, setRepoName] = useState('codelock-solutions');

  const list = useQuery({ queryKey: ['integrations'], queryFn: () => api.integrations.list() });
  const github = list.data?.integrations.find((i) => i.provider === 'GITHUB');
  const configured = list.data?.available.github ?? false;

  const connect = useMutation({
    mutationFn: () => api.integrations.githubAuthorizeUrl(),
    onSuccess: ({ url }) => {
      // Full navigation, not fetch: OAuth must happen in the browser's own
      // address bar so the user can see the domain they are authorizing.
      window.location.href = url;
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const repos = useQuery({
    queryKey: ['integrations', 'github', 'repos'],
    queryFn: () => api.integrations.githubRepos(),
    enabled: Boolean(github),
  });

  const chooseRepo = useMutation({
    mutationFn: (input: { repoFullName?: string; createRepoNamed?: string }) =>
      api.integrations.updateGithub(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('Solutions will be committed there from now on.');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const disconnect = useMutation({
    mutationFn: () => api.integrations.disconnect('GITHUB'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('GitHub disconnected.');
    },
  });

  return (
    <Card>
      <CardHeader className="flex items-center gap-2">
        <GithubMark className="size-4" />
        <CardTitle>GitHub</CardTitle>
        {github ? (
          <Badge tone="success" className="ml-auto">
            {github.externalUsername}
          </Badge>
        ) : (
          <Badge className="ml-auto">Not connected</Badge>
        )}
      </CardHeader>

      <CardBody className="space-y-4">
        <p className="text-sm text-muted">
          Every solution that clears the speed gate is committed to a repository you choose.
          Those are real commits authored by you, so they show up on your contribution graph.
        </p>

        {!configured ? (
          <p className="rounded-sm bg-warning-soft px-3 py-2 text-[13px] text-warning">
            The server has no GitHub OAuth app configured. Set{' '}
            <code className="font-mono">GITHUB_CLIENT_ID</code> and{' '}
            <code className="font-mono">GITHUB_CLIENT_SECRET</code> to enable this.
          </p>
        ) : !github ? (
          <div className="space-y-2">
            <Button onClick={() => connect.mutate()} loading={connect.isPending}>
              <GithubMark className="size-4" />
              Connect GitHub
            </Button>
            <p className="text-[13px] text-faint">
              Requests <code className="font-mono">public_repo</code> only — CodeLock never asks
              for access to your private repositories.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {github.repoFullName ? (
              <div className="flex items-center gap-2 rounded-sm border border-border bg-surface-2 px-3 py-2">
                <span className="min-w-0 flex-1 truncate font-mono text-[13px]">
                  {github.repoFullName}
                  <span className="text-faint"> · {github.repoBranch}</span>
                </span>
                <a
                  href={`https://github.com/${github.repoFullName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-muted hover:text-fg"
                  aria-label={`Open ${github.repoFullName} on GitHub`}
                >
                  <ExternalLink className="size-4" aria-hidden />
                </a>
              </div>
            ) : (
              <p className="rounded-sm bg-warning-soft px-3 py-2 text-[13px] text-warning">
                Connected, but no repository picked yet — nothing is being committed.
              </p>
            )}

            <Field label="Use an existing repository" htmlFor="repo">
              <select
                id="repo"
                defaultValue={github.repoFullName ?? ''}
                disabled={repos.isLoading || chooseRepo.isPending}
                onChange={(e) =>
                  e.target.value && chooseRepo.mutate({ repoFullName: e.target.value })
                }
                className="h-9 w-full rounded-sm border border-border-strong bg-surface px-2 text-sm disabled:opacity-50"
              >
                <option value="">
                  {repos.isLoading ? 'Loading repositories…' : 'Select a repository'}
                </option>
                {repos.data?.repos.map((repo) => (
                  <option key={repo.fullName} value={repo.fullName}>
                    {repo.fullName}
                    {repo.private ? ' (private)' : ''}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Or create a new one"
              htmlFor="newRepo"
              hint="Created as a public repository under your account."
            >
              <div className="flex gap-2">
                <Input
                  id="newRepo"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  pattern="[\w.-]+"
                />
                <Button
                  variant="outline"
                  loading={chooseRepo.isPending}
                  onClick={() => chooseRepo.mutate({ createRepoNamed: repoName })}
                >
                  Create
                </Button>
              </div>
            </Field>

            {github.lastError && (
              <p role="alert" className="rounded-sm bg-danger-soft px-3 py-2 text-[13px] text-danger">
                Last sync failed: {github.lastError}
              </p>
            )}

            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-[13px] text-faint">
                Last synced {formatRelative(github.lastSyncAt)}
              </span>
              <Button variant="ghost" size="sm" onClick={() => disconnect.mutate()}>
                Disconnect
              </Button>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
