import { useState } from 'react';
import { DateRange, RangeKeyDict } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

export function DateRangePicker({ value, onChange }: {
  value: { startDate: Date; endDate: Date };
  onChange: (range: { startDate: Date; endDate: Date }) => void;
}) {
  const [range, setRange] = useState({
    startDate: value.startDate,
    endDate: value.endDate,
    key: 'selection',
  });

  function handleChange(ranges: RangeKeyDict) {
    const sel = ranges.selection;
    setRange({
      startDate: sel.startDate ?? new Date(),
      endDate: sel.endDate ?? new Date(),
      key: sel.key || 'selection',
    });
    onChange({
      startDate: sel.startDate ?? new Date(),
      endDate: sel.endDate ?? new Date(),
    });
  }

  return (
    <DateRange
      ranges={[range]}
      onChange={handleChange}
      moveRangeOnFirstSelection={false}
      months={1}
      direction="horizontal"
      rangeColors={["#f59e42"]}
      maxDate={new Date()}
    />
  );
}
