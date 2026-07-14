import type { FormEvent } from "react";
import { Languages, Send, ShieldQuestion, UserRoundCog } from "lucide-react";
import type { VolunteerRequest } from "@/lib/ai/schemas";
import { languageOptions, type SupportedLanguage } from "@/lib/content/languageOptions";
import { sopTopics, volunteerRoles } from "@/lib/content/volunteerSops";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

interface VolunteerFormProps {
  role: VolunteerRequest["role"];
  topic: VolunteerRequest["topic"];
  question: string;
  language: SupportedLanguage;
  isLoading: boolean;
  validationError: string | undefined;
  onRoleChange: (role: VolunteerRequest["role"]) => void;
  onTopicChange: (topic: VolunteerRequest["topic"]) => void;
  onQuestionChange: (question: string) => void;
  onLanguageChange: (language: SupportedLanguage) => void;
  onSubmit: () => void;
}

const volunteerSuggestions = [
  "A family speaking Arabic needs the nearest accessible entrance.",
  "A guest feels unwell near the north concourse. What can I do?",
  "The queue at Gate C is growing. Who should I contact?",
];

function VolunteerSuggestions({
  disabled,
  onSelect,
}: {
  disabled: boolean;
  onSelect: (question: string) => void;
}) {
  return (
    <div className="suggestion-chips" aria-label="Common volunteer questions">
      {volunteerSuggestions.map((suggestion) => (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelect(suggestion)}
          key={suggestion}
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}

function PrivacyNotice() {
  return (
    <p className="form-privacy">
      <UserRoundCog size={14} aria-hidden="true" /> Questions are processed for this response and
      not saved as conversation history.
    </p>
  );
}

export function VolunteerForm({
  role,
  topic,
  question,
  language,
  isLoading,
  validationError,
  onRoleChange,
  onTopicChange,
  onQuestionChange,
  onLanguageChange,
  onSubmit,
}: VolunteerFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="volunteer-form" onSubmit={handleSubmit} noValidate>
      <div className="assistant-form__heading">
        <div>
          <p className="eyebrow">Trusted procedure finder</p>
          <h2>How can we help?</h2>
        </div>
        <span className="assistant-form__step">SOP / 01</span>
      </div>
      <div className="form-grid form-grid--two">
        <Select
          id="volunteer-role"
          label="My role"
          value={role}
          disabled={isLoading}
          onChange={(event) => onRoleChange(event.target.value as VolunteerRequest["role"])}
        >
          {volunteerRoles.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select
          id="sop-topic"
          label="SOP topic"
          value={topic}
          disabled={isLoading}
          onChange={(event) => onTopicChange(event.target.value as VolunteerRequest["topic"])}
        >
          {sopTopics.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
      <label className="field" htmlFor="volunteer-question">
        <span className="field__label">Describe the situation</span>
        <span className="field__hint">
          Do not include a guest’s name, ticket number or personal details.
        </span>
        <span className="textarea-wrap">
          <textarea
            id="volunteer-question"
            rows={5}
            maxLength={600}
            disabled={isLoading}
            value={question}
            onChange={(event) => onQuestionChange(event.target.value)}
            aria-invalid={Boolean(validationError)}
            aria-describedby={
              validationError ? "volunteer-error volunteer-count" : "volunteer-count"
            }
            placeholder="Tell us what the guest needs and where you are…"
          />
          <span className="textarea-wrap__count" id="volunteer-count">
            {question.length}/600
          </span>
        </span>
        {validationError ? (
          <span className="field__error" id="volunteer-error">
            {validationError}
          </span>
        ) : null}
      </label>
      <VolunteerSuggestions disabled={isLoading} onSelect={onQuestionChange} />
      <div className="volunteer-form__footer">
        <div className="volunteer-language">
          <Languages size={17} aria-hidden="true" />
          <Select
            id="volunteer-language"
            label="Answer language"
            hideLabel
            value={language}
            disabled={isLoading}
            onChange={(event) => onLanguageChange(event.target.value as SupportedLanguage)}
            aria-label="Answer language"
          >
            {languageOptions.map((option) => (
              <option value={option.value} key={option.value}>
                {option.nativeLabel}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" size="large" isLoading={isLoading}>
          {isLoading ? (
            "Checking SOP"
          ) : (
            <>
              <ShieldQuestion size={18} aria-hidden="true" /> Get trusted steps{" "}
              <Send size={15} aria-hidden="true" />
            </>
          )}
        </Button>
      </div>
      <PrivacyNotice />
    </form>
  );
}
