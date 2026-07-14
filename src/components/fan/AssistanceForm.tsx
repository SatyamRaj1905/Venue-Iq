import type { FormEvent } from "react";
import { Accessibility, Ear, Languages, Route, Send, UsersRound } from "lucide-react";
import type { FanAssistRequest } from "@/lib/ai/schemas";
import { languageOptions, type SupportedLanguage } from "@/lib/content/languageOptions";
import { STADIUM_NODES } from "@/lib/domain/stadiumGraph";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";

type FanPreferences = FanAssistRequest["preferences"];

interface AssistanceFormProps {
  currentLocation: string;
  destination: string;
  language: SupportedLanguage;
  message: string;
  preferences: FanPreferences;
  isLoading: boolean;
  validationError: string | undefined;
  onCurrentLocationChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onLanguageChange: (value: SupportedLanguage) => void;
  onMessageChange: (value: string) => void;
  onPreferencesChange: (value: FanPreferences) => void;
  onSubmit: () => void;
}

const locationNodes = STADIUM_NODES.filter((node) =>
  ["gate", "concourse", "transport-pickup"].includes(node.kind),
);
const destinationNodes = STADIUM_NODES.filter((node) =>
  ["section", "gate", "medical", "assistance-desk", "accessible-toilet"].includes(node.kind),
);

const suggestions = [
  "Find a wheelchair-friendly route to Section 214",
  "Where is the nearest accessible toilet?",
  "Show me a quieter way to my section",
];

function FanSuggestions({
  disabled,
  onSelect,
}: {
  disabled: boolean;
  onSelect: (question: string) => void;
}) {
  return (
    <div className="suggestion-chips" aria-label="Suggested questions">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(suggestion)}
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}

function AssistanceHeading() {
  return (
    <div className="assistant-form__heading">
      <div>
        <p className="eyebrow">Plan your movement</p>
        <h2>Where do you need to go?</h2>
      </div>
      <span className="assistant-form__step">01 / Route</span>
    </div>
  );
}

function PreferenceControls({
  preferences,
  disabled,
  onChange,
}: {
  preferences: FanPreferences;
  disabled: boolean;
  onChange: (value: FanPreferences) => void;
}) {
  return (
    <fieldset className="preference-fieldset">
      <legend>Route preferences</legend>
      <div className="preference-grid">
        <Toggle
          checked={preferences.stepFree}
          onChange={(checked) => onChange({ ...preferences, stepFree: checked })}
          disabled={disabled}
          label="Step-free"
          description="Use lifts and ramps only"
          icon={<Accessibility size={18} />}
        />
        <Toggle
          checked={preferences.avoidCrowds}
          onChange={(checked) => onChange({ ...preferences, avoidCrowds: checked })}
          disabled={disabled}
          label="Avoid crowds"
          description="Prefer lower-density paths"
          icon={<UsersRound size={18} />}
        />
        <Toggle
          checked={preferences.preferQuiet}
          onChange={(checked) => onChange({ ...preferences, preferQuiet: checked })}
          disabled={disabled}
          label="Quieter route"
          description="Reduce high-stimulation areas"
          icon={<Ear size={18} />}
        />
      </div>
    </fieldset>
  );
}

function RouteSelectors({
  currentLocation,
  destination,
  disabled,
  onCurrentLocationChange,
  onDestinationChange,
}: Pick<
  AssistanceFormProps,
  "currentLocation" | "destination" | "onCurrentLocationChange" | "onDestinationChange"
> & { disabled: boolean }) {
  return (
    <div className="form-grid form-grid--two">
      <Select
        id="current-location"
        label="I am near"
        value={currentLocation}
        disabled={disabled}
        onChange={(event) => onCurrentLocationChange(event.target.value)}
      >
        {locationNodes.map((node) => (
          <option key={node.id} value={node.id}>
            {node.name}
          </option>
        ))}
      </Select>
      <Select
        id="destination"
        label="Take me to"
        value={destination}
        disabled={disabled}
        onChange={(event) => onDestinationChange(event.target.value)}
      >
        {destinationNodes.map((node) => (
          <option key={node.id} value={node.id}>
            {node.name}
          </option>
        ))}
      </Select>
    </div>
  );
}

function FanMessageField({
  message,
  validationError,
  disabled,
  onMessageChange,
}: Pick<AssistanceFormProps, "message" | "validationError" | "onMessageChange"> & {
  disabled: boolean;
}) {
  return (
    <label className="field" htmlFor="fan-message">
      <span className="field__label">Ask VenueIQ</span>
      <span className="field__hint">Mention mobility, sensory or crowd preferences.</span>
      <span className="textarea-wrap">
        <textarea
          aria-describedby={
            validationError ? "fan-message-error fan-message-count" : "fan-message-count"
          }
          aria-invalid={Boolean(validationError)}
          id="fan-message"
          maxLength={600}
          disabled={disabled}
          onChange={(event) => onMessageChange(event.target.value)}
          placeholder="For example: I use a wheelchair and want the safest low-crowd route…"
          rows={4}
          value={message}
        />
        <span id="fan-message-count" className="textarea-wrap__count">
          {message.length}/600
        </span>
      </span>
      {validationError ? (
        <span className="field__error" id="fan-message-error">
          {validationError}
        </span>
      ) : null}
    </label>
  );
}

function AssistanceFooter({
  language,
  isLoading,
  onLanguageChange,
}: Pick<AssistanceFormProps, "language" | "isLoading" | "onLanguageChange">) {
  return (
    <div className="assistant-form__footer">
      <Select
        id="fan-language"
        label="Response language"
        hideLabel
        value={language}
        disabled={isLoading}
        onChange={(event) => onLanguageChange(event.target.value as SupportedLanguage)}
        aria-label="Response language"
      >
        {languageOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.nativeLabel}
          </option>
        ))}
      </Select>
      <span className="assistant-form__language-icon" aria-hidden="true">
        <Languages size={17} />
      </span>
      <Button type="submit" size="large" isLoading={isLoading}>
        {isLoading ? (
          "Finding route"
        ) : (
          <>
            <Route size={18} aria-hidden="true" /> Find my route{" "}
            <Send size={16} aria-hidden="true" />
          </>
        )}
      </Button>
    </div>
  );
}

export function AssistanceForm({
  currentLocation,
  destination,
  language,
  message,
  preferences,
  isLoading,
  validationError,
  onCurrentLocationChange,
  onDestinationChange,
  onLanguageChange,
  onMessageChange,
  onPreferencesChange,
  onSubmit,
}: AssistanceFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="assistant-form" onSubmit={handleSubmit} noValidate>
      <AssistanceHeading />

      <RouteSelectors
        currentLocation={currentLocation}
        destination={destination}
        disabled={isLoading}
        onCurrentLocationChange={onCurrentLocationChange}
        onDestinationChange={onDestinationChange}
      />

      <FanMessageField
        message={message}
        validationError={validationError}
        disabled={isLoading}
        onMessageChange={onMessageChange}
      />

      <FanSuggestions disabled={isLoading} onSelect={onMessageChange} />

      <PreferenceControls
        preferences={preferences}
        disabled={isLoading}
        onChange={onPreferencesChange}
      />

      <AssistanceFooter
        language={language}
        isLoading={isLoading}
        onLanguageChange={onLanguageChange}
      />
    </form>
  );
}
