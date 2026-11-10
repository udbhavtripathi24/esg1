import DisclosureWorkspace from './DisclosureWorkspace.jsx'

/** Upload Center → GRI (the shared disclosure workspace). */
export default function GriWorkspace({ pushToast }) {
  return <DisclosureWorkspace fw="gri" pushToast={pushToast} />
}
