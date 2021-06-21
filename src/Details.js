import { format, isSameDay } from "date-fns";

const Details = ({ focusedProgram }) => {
  return (
    <div className="details">
      {focusedProgram && (
        <>
          <img src={focusedProgram?.image} className="details-image" />
          <div>
            <div style={{ marginBottom: 4 }}>{focusedProgram?.title}</div>
            <div style={{ marginBottom: 8, fontSize: 14 }}>
              {!isSameDay(new Date(), focusedProgram.start) && (
                <>{format(focusedProgram.end, "EEEE, dd/MM")} at </>
              )}
              {format(focusedProgram.start, "HH:mm")} -
              {format(focusedProgram.end, "HH:mm")}
            </div>
            <div style={{ fontSize: 14, opacity: 0.7 }}>
              {focusedProgram?.description}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Details;
