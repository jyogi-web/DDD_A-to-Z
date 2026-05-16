package repositoryanalysis

import "time"

type CommitItem struct {
	SHA       string
	Message   string
	Committed time.Time
}

type LanguageContribution struct {
	Name string
	CP   int64
}

type Contribution struct {
	Repo      string
	Message   string
	Language  string
	CP        int64
	Timestamp time.Time
}

type AnalysisResult struct {
	TotalCommits      int64
	TotalCP           int64
	LanguageBreakdown []LanguageContribution
	Contributions     []Contribution
}
