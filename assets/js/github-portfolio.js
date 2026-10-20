(function () {
  const username = "Kingfrankbob";
  const languageTarget = document.getElementById("github-languages");
  const projectsTarget = document.getElementById("github-projects");
  const statusTarget = document.getElementById("github-status");

  if (!languageTarget || !projectsTarget || !statusTarget) return;

  async function getCommitCount(repository) {
    const response = await fetch(
      `https://api.github.com/repos/${username}/${encodeURIComponent(repository.name)}/commits?per_page=1`,
      { headers: { Accept: "application/vnd.github+json" } },
    );
    if (!response.ok) return null;

    const commits = await response.json();
    const lastPage = response.headers
      .get("Link")
      ?.match(/[?&]page=(\d+)[^>]*>;\s*rel="last"/);
    return lastPage ? Number(lastPage[1]) : commits.length;
  }

  function renderLanguages(repositories) {
    const counts = new Map();
    repositories.forEach((repository) => {
      if (repository.language) {
        counts.set(
          repository.language,
          (counts.get(repository.language) || 0) + 1,
        );
      }
    });

    const languages = Array.from(counts.entries())
      .sort(
        (first, second) =>
          second[1] - first[1] || first[0].localeCompare(second[0]),
      )
      .slice(0, 8);

    if (!languages.length) {
      languageTarget.textContent = "No language data is available yet.";
      return;
    }

    languageTarget.replaceChildren(
      ...languages.map(([name, count]) => {
        const tag = document.createElement("span");
        tag.className = "language-tag";
        tag.textContent = `${name} (${count})`;
        return tag;
      }),
    );
  }

  async function renderProjects(repositories) {
    const candidates = repositories.filter(
      (repository) => !repository.fork && !repository.archived,
    );

    for (let index = candidates.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [candidates[index], candidates[randomIndex]] = [
        candidates[randomIndex],
        candidates[index],
      ];
    }
    const featuredProjects = 6;
    const featured = candidates.slice(0, featuredProjects);
    if (!featured.length) {
      statusTarget.textContent =
        "No public repositories are available to feature.";
      return;
    }

    const projects = await Promise.all(
      featured.map(async (repository) => ({
        repository,
        commitCount: await getCommitCount(repository).catch(() => null),
      })),
    );

    projectsTarget.replaceChildren(
      ...projects.map(({ repository, commitCount }) => {
        const link = document.createElement("a");
        const copy = document.createElement("div");
        const title = document.createElement("h3");
        const description = document.createElement("p");
        const meta = document.createElement("div");
        const language = document.createElement("span");
        const commits = document.createElement("span");

        link.className = "github-project";
        link.href = repository.html_url;
        link.target = "_blank";
        link.rel = "noreferrer";
        copy.className = "github-project-copy";
        title.textContent = repository.name;
        description.textContent =
          repository.description || "A public project on GitHub.";
        meta.className = "github-project-meta";
        language.className = "github-project-language";
        language.textContent = repository.language || "Multiple languages";
        commits.className = "github-project-commits";
        commits.textContent =
          commitCount === null
            ? "Commit count unavailable"
            : `${commitCount.toLocaleString()} commits`;
        meta.append(language, commits);
        copy.append(title, description, meta);
        link.append(copy);
        return link;
      }),
    );
    statusTarget.textContent = `A fresh selection from ${candidates.length} public projects.`;
  }

  fetch(
    `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`,
    {
      headers: { Accept: "application/vnd.github+json" },
    },
  )
    .then((response) => {
      if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
      return response.json();
    })
    .then((repositories) => {
      renderLanguages(repositories);
      renderProjects(repositories);
    })
    .catch(() => {
      languageTarget.textContent =
        "Language details are temporarily unavailable.";
      projectsTarget.replaceChildren();
      statusTarget.textContent =
        "GitHub projects could not be loaded. Visit the profile to browse repositories.";
    });
})();
