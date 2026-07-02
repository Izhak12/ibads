import * as SliderPrimitive from "@radix-ui/react-slider";

export function AppleSlider({
  value,
  onValueChange,
  min = 1,
  max = 10,
}: {
  value: number;
  onValueChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <SliderPrimitive.Root
      dir="rtl"
      value={[value]}
      min={min}
      max={max}
      step={1}
      onValueChange={(v) => onValueChange(v[0])}
      className="relative flex w-full touch-none select-none items-center h-6"
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-black/10">
        <SliderPrimitive.Range className="absolute h-full bg-black" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className="block h-6 w-6 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.15),0_0_0_0.5px_rgba(0,0,0,0.08)] transition-transform hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        aria-label="כמות"
      />
    </SliderPrimitive.Root>
  );
}
