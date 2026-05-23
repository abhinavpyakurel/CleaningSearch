type JobPageProps = {
  params: { id: string };
};

export default function JobPage({ params }: JobPageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-semibold">Job {params.id}</h1>
    </main>
  );
}
