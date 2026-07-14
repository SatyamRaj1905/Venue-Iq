import { Lock, RotateCcw, Unlock } from "lucide-react";
import { scenarioOptions, type ScenarioId } from "@/lib/content/scenarioOptions";
import { Button } from "@/components/ui/Button";

interface ScenarioControlsProps {
  activeScenario: ScenarioId;
  isPaused: boolean;
  isLoading: boolean;
  onSelect: (scenario: ScenarioId) => void;
  onPauseChange: (paused: boolean) => void;
}

export function ScenarioControls({
  activeScenario,
  isPaused,
  isLoading,
  onSelect,
  onPauseChange,
}: ScenarioControlsProps) {
  return (
    <section className="scenario-panel" aria-labelledby="scenario-title">
      <div className="panel-heading scenario-panel__heading">
        <div>
          <p className="eyebrow">Safe simulator</p>
          <h2 id="scenario-title">Scenario controls</h2>
        </div>
        <Button
          size="small"
          variant={isPaused ? "primary" : "secondary"}
          onClick={() => onPauseChange(!isPaused)}
        >
          {isPaused ? (
            <>
              <Unlock size={15} aria-hidden="true" /> Unlock snapshot
            </>
          ) : (
            <>
              <Lock size={15} aria-hidden="true" /> Lock snapshot
            </>
          )}
        </Button>
      </div>
      <div className="scenario-grid" aria-label="Choose a simulated venue scenario">
        {scenarioOptions.map(({ id, shortLabel, description, icon: Icon }) => {
          const isActive = id === activeScenario;
          return (
            <button
              aria-pressed={isActive}
              className={isActive ? "scenario-button scenario-button--active" : "scenario-button"}
              disabled={isPaused || isLoading}
              aria-describedby="scenario-control-note"
              key={id}
              onClick={() => onSelect(id)}
              title={description}
              type="button"
            >
              <Icon size={17} aria-hidden="true" />
              <span>{shortLabel}</span>
              {isActive ? <i aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>
      <p className="scenario-panel__note" id="scenario-control-note">
        <RotateCcw size={14} aria-hidden="true" />
        {isPaused
          ? "Snapshot locked. Unlock it to activate another scenario."
          : "Each selection advances one deterministic simulation step; no timer runs in the background."}
      </p>
    </section>
  );
}
