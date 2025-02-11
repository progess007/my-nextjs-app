const Favorites = () => {

    return(
        <>
        <div className='flex justify-between items-center p-5 bg-gray-100 text-white'>
          <div>
            <p className="text-4xl font-semibold text-purple-600">รายการโปรด</p>
          </div>
          <div className='text-black'>
            <a href="/dashboard/user" className="no-underline hover:text-gray-300">หน้าแรก</a>
            <span className="mx-2">/</span>
            <a href="#" className="no-underline hover:text-gray-300">รายการโปรด</a>
          </div>
        </div>

            <h2 className="text-black text-2xl">
                Favorites Page
            </h2>
        </>
    );

};

export default Favorites;