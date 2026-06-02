/** Keep Radix Sheet/Dialog open when the user interacts with portaled Select menus. */
export function shouldPreventRadixOverlayDismiss(event: Event): boolean {
  const target = event.target
  if (!(target instanceof Element)) return false
  return Boolean(
    target.closest(
      [
        "[data-radix-select-content]",
        "[data-radix-select-viewport]",
        "[data-radix-popper-content-wrapper]",
        "[role='listbox']",
      ].join(",")
    )
  )
}
