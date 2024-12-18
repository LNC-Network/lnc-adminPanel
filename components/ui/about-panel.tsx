interface AboutInterface {
  about: string;
}

const AboutPanel: React.FC<AboutInterface> = ({ about }) => {
  return (
    <div className="w-1/2 bg-sidebar flex flex-col items-center p-2">
      <h1 className="text-xl">About</h1>
      <p>{about}</p>
    </div>
  );
};

export default AboutPanel;
