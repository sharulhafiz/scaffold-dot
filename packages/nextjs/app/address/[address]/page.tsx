import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ address: string }>;
};

export default async function AddressRedirectPage(props: PageProps) {
  const params = await props.params;
  const address = params?.address;

  if (address) {
    redirect(`/blockexplorer/address/${address}`);
  }

  redirect("/blockexplorer");
}
