"use client";
export default function Analytics() {
  return (
    <div className="p-10 flex gap-3 flex-wrap">
      {/* graph */}
      <div className="h-96 w-96 center bg-slate-800 text-white">
        {/*children component*/}
      </div>
      {/* numbered analytics */}
      <div className="flex flex-col h-96 w-96 justify-center items-center align-middle">
        <div className="h-full w-full center bg-slate-800 text-white ">
          usage
        </div>
        <div className="h-full w-full center bg-slate-800 text-white ">
          new users
        </div>
      </div>
    </div>
  );
}
