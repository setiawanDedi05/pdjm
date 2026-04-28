import { useAppStore } from "@/stores/appStore";

const Loading = () => {
    const {loading} = useAppStore();
    if(loading) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/20 z-50">
                <div className="relative flex items-center justify-center">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl animate-pulse rotate-12 flex items-center justify-center text-white font-bold text-xl">
                    PDJM
                    </div>
                    <div className="absolute w-20 h-20 border-2 border-blue-100 rounded-2xl animate-ping"></div>
                </div>
                <p className="mt-6 text-sm font-medium text-gray-500 tracking-widest uppercase animate-bounce">
                    Loading...
                </p>
            </div>
        )
    }
    return null
}

export default Loading