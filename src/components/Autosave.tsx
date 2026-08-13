export default function Autosave({state}:{state:'SAVED'|'SAVING'|'ERROR'|'UNSAVED'}) {
  return <span className={`autosave autosave-${state.toLowerCase()}`}><i />{state}</span>
}
