import Link from "next/link";

interface Props {
    href: string,
    children: React.ReactNode | React.ReactNode[]
}

export default function LinkItem(props: Props) {

    

    return <div className="w-full  px-4 flex flex-row justify-start items-center">
        <Link href={props.href} className="text-xl hover:bg-white transition-all duration-200 hover:text-black p-2 rounded-xl w-full">{props.children}</Link>
    </div>
}