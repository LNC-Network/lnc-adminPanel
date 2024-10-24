export const Top = ({ heading }: { heading: string }) => {
  return (
    <>
      <div className="bg-slate-800 h-16 w-full text-white flex justify-center items-center">
        <h1 className="text-3xl">{heading}</h1>
      </div>
    </>
  );
};
