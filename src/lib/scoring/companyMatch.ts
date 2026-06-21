export interface CompanyOfferInput {
  id: string;
  company_name: string;
  title: string;
  required_skills: readonly string[];
}

export interface CompanyMatchResult {
  offerId: string;
  companyName: string;
  title: string;
  matchPercentage: number;
  matchingSkills: string[];
  missingSkills: string[];
  explanation: string;
}

function normalizeSkill(skill: string): string {
  return skill.trim().toLocaleLowerCase("en");
}

function uniqueSkills(skills: readonly string[]): string[] {
  const seen = new Set<string>();

  return skills.filter((skill) => {
    const normalizedSkill = normalizeSkill(skill);

    if (!normalizedSkill || seen.has(normalizedSkill)) return false;

    seen.add(normalizedSkill);
    return true;
  });
}

function createExplanation(
  matchPercentage: number,
  matchingSkills: readonly string[],
  missingSkills: readonly string[],
): string {
  if (matchingSkills.length === 0 && missingSkills.length === 0) {
    return "This offer does not list required skills, so no skill match can be calculated.";
  }

  if (missingSkills.length === 0) {
    return `Strong match: the learner covers all ${matchingSkills.length} required skills.`;
  }

  if (matchingSkills.length === 0) {
    return `No current skill match. Priority gaps: ${missingSkills.join(", ")}.`;
  }

  return `${matchPercentage}% match with ${matchingSkills.length} required skills covered. Develop: ${missingSkills.join(", ")}.`;
}

export function findTopCompanyMatches(
  learnerSkills: readonly string[],
  offers: readonly CompanyOfferInput[],
): CompanyMatchResult[] {
  const normalizedLearnerSkills = new Set(
    uniqueSkills(learnerSkills).map(normalizeSkill),
  );

  return offers
    .map((offer): CompanyMatchResult => {
      const requiredSkills = uniqueSkills(offer.required_skills);
      const matchingSkills = requiredSkills.filter((skill) =>
        normalizedLearnerSkills.has(normalizeSkill(skill)),
      );
      const missingSkills = requiredSkills.filter(
        (skill) => !normalizedLearnerSkills.has(normalizeSkill(skill)),
      );
      const matchPercentage = requiredSkills.length
        ? Math.round((matchingSkills.length / requiredSkills.length) * 100)
        : 0;

      return {
        offerId: offer.id,
        companyName: offer.company_name,
        title: offer.title,
        matchPercentage,
        matchingSkills,
        missingSkills,
        explanation: createExplanation(
          matchPercentage,
          matchingSkills,
          missingSkills,
        ),
      };
    })
    .sort(
      (first, second) =>
        second.matchPercentage - first.matchPercentage ||
        second.matchingSkills.length - first.matchingSkills.length ||
        first.companyName.localeCompare(second.companyName) ||
        first.title.localeCompare(second.title),
    )
    .slice(0, 3);
}
