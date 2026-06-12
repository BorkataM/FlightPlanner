// ISO 3166-1 numeric codes used by world-atlas topojson feature IDs
export const COUNTRY_ISO_MAP: Record<string, string> = {
  Afghanistan: '4', Albania: '8', Algeria: '12', Andorra: '20', Angola: '24',
  'Antigua and Barbuda': '28', Argentina: '32', Armenia: '51', Australia: '36',
  Austria: '40', Azerbaijan: '31', Bahamas: '44', Bahrain: '48', Bangladesh: '50',
  Barbados: '52', Belarus: '112', Belgium: '56', Belize: '84', Benin: '204',
  Bhutan: '64', Bolivia: '68', 'Bosnia and Herzegovina': '70', Botswana: '72',
  Brazil: '76', 'Brunei Darussalam': '96', Brunei: '96', Bulgaria: '100',
  'Burkina Faso': '854', Burundi: '108', Cambodia: '116', Cameroon: '120',
  Canada: '124', 'Cape Verde': '132', 'Central African Republic': '140',
  Chad: '148', Chile: '152', China: '156', Colombia: '170', Comoros: '174',
  Congo: '178', 'Costa Rica': '188', Croatia: '191', Cuba: '192', Cyprus: '196',
  'Czech Republic': '203', Czechia: '203', Denmark: '208', Djibouti: '262',
  'Dominican Republic': '214', Ecuador: '218', Egypt: '818', 'El Salvador': '222',
  'Equatorial Guinea': '226', Eritrea: '232', Estonia: '233', Ethiopia: '231',
  Fiji: '242', Finland: '246', France: '250', Gabon: '266', Gambia: '270',
  Georgia: '268', Germany: '276', Ghana: '288', Greece: '300', Guatemala: '320',
  Guinea: '324', 'Guinea-Bissau': '624', Guyana: '328', Haiti: '332',
  Honduras: '340', Hungary: '348', Iceland: '352', India: '356', Indonesia: '360',
  Iran: '364', 'Islamic Republic of Iran': '364', Iraq: '368', Ireland: '372',
  Israel: '376', Italy: '380', 'Ivory Coast': '384', "Côte d'Ivoire": '384',
  Jamaica: '388', Japan: '392', Jordan: '400', Kazakhstan: '398', Kenya: '404',
  Kuwait: '414', Kyrgyzstan: '417', Laos: '418', "Lao People's Democratic Republic": '418',
  Latvia: '428', Lebanon: '422', Lesotho: '426', Liberia: '430', Libya: '434',
  Liechtenstein: '438', Lithuania: '440', Luxembourg: '442', Madagascar: '450',
  Malawi: '454', Malaysia: '458', Maldives: '462', Mali: '466', Malta: '470',
  Mauritania: '478', Mauritius: '480', Mexico: '484', Moldova: '498',
  'Republic of Moldova': '498', Monaco: '492', Mongolia: '496', Montenegro: '499',
  Morocco: '504', Mozambique: '508', Myanmar: '104', 'Burma': '104',
  Namibia: '516', Nepal: '524', Netherlands: '528', 'New Zealand': '554',
  Nicaragua: '558', Niger: '562', Nigeria: '566', 'North Korea': '408',
  'North Macedonia': '807', Macedonia: '807', Norway: '578', Oman: '512',
  Pakistan: '586', Panama: '591', 'Papua New Guinea': '598', Paraguay: '600',
  Peru: '604', Philippines: '608', Poland: '616', Portugal: '620', Qatar: '634',
  Romania: '642', Russia: '643', 'Russian Federation': '643', Rwanda: '646',
  'Saudi Arabia': '682', Senegal: '686', Serbia: '688', 'Sierra Leone': '694',
  Singapore: '702', Slovakia: '703', Slovenia: '705', Somalia: '706',
  'South Africa': '710', 'South Korea': '410', 'Republic of Korea': '410',
  'South Sudan': '728', Spain: '724', 'Sri Lanka': '144', Sudan: '729',
  Suriname: '740', Sweden: '752', Switzerland: '756', Syria: '760',
  'Syrian Arab Republic': '760', Taiwan: '158', Tajikistan: '762',
  Tanzania: '834', 'United Republic of Tanzania': '834', Thailand: '764',
  'Timor-Leste': '626', Togo: '768', 'Trinidad and Tobago': '780',
  Tunisia: '788', Turkey: '792', 'Türkiye': '792', Turkmenistan: '795',
  Uganda: '800', Ukraine: '804', 'United Arab Emirates': '784',
  'United Kingdom': '826', 'United States': '840', 'United States of America': '840',
  USA: '840', Uruguay: '858', Uzbekistan: '860', Venezuela: '862',
  'Bolivarian Republic of Venezuela': '862', Vietnam: '704', 'Viet Nam': '704',
  Yemen: '887', Zambia: '894', Zimbabwe: '716',
  // Additional variants
  'Congo, Republic of the': '178', 'DR Congo': '180',
  'Democratic Republic of the Congo': '180', 'Congo, DRC': '180',
  Palestine: '275', 'State of Palestine': '275',
  Kosovo: '383', 'North Cyprus': '196',
  'Korea, Republic of': '410', 'Korea, Democratic People\'s Republic of': '408',
}

// Numeric → canonical country name (derived from COUNTRY_ISO_MAP)
export const NUMERIC_TO_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRY_ISO_MAP).map(([name, num]) => [num, name])
)

// Alpha-2 (ISO 3166-1) → numeric code, matching world-atlas geo.id
export const ALPHA2_TO_NUMERIC: Record<string, string> = {
  AF:'4',AL:'8',DZ:'12',AD:'20',AO:'24',AG:'28',AR:'32',AM:'51',AU:'36',AT:'40',
  AZ:'31',BS:'44',BH:'48',BD:'50',BB:'52',BY:'112',BE:'56',BZ:'84',BJ:'204',BT:'64',
  BO:'68',BA:'70',BW:'72',BR:'76',BN:'96',BG:'100',BF:'854',BI:'108',KH:'116',CM:'120',
  CA:'124',CV:'132',CF:'140',TD:'148',CL:'152',CN:'156',CO:'170',KM:'174',CG:'178',
  CR:'188',HR:'191',CU:'192',CY:'196',CZ:'203',DK:'208',DJ:'262',DO:'214',EC:'218',
  EG:'818',SV:'222',GQ:'226',ER:'232',EE:'233',ET:'231',FJ:'242',FI:'246',FR:'250',
  GA:'266',GM:'270',GE:'268',DE:'276',GH:'288',GR:'300',GT:'320',GN:'324',GW:'624',
  GY:'328',HT:'332',HN:'340',HU:'348',IS:'352',IN:'356',ID:'360',IR:'364',IQ:'368',
  IE:'372',IL:'376',IT:'380',CI:'384',JM:'388',JP:'392',JO:'400',KZ:'398',KE:'404',
  KW:'414',KG:'417',LA:'418',LV:'428',LB:'422',LS:'426',LR:'430',LY:'434',LI:'438',
  LT:'440',LU:'442',MG:'450',MW:'454',MY:'458',MV:'462',ML:'466',MT:'470',MR:'478',
  MU:'480',MX:'484',MD:'498',MC:'492',MN:'496',ME:'499',MA:'504',MZ:'508',MM:'104',
  NA:'516',NP:'524',NL:'528',NZ:'554',NI:'558',NE:'562',NG:'566',KP:'408',MK:'807',
  NO:'578',OM:'512',PK:'586',PA:'591',PG:'598',PY:'600',PE:'604',PH:'608',PL:'616',
  PT:'620',QA:'634',RO:'642',RU:'643',RW:'646',SA:'682',SN:'686',RS:'688',SL:'694',
  SG:'702',SK:'703',SI:'705',SO:'706',ZA:'710',KR:'410',SS:'728',ES:'724',LK:'144',
  SD:'729',SR:'740',SE:'752',CH:'756',SY:'760',TW:'158',TJ:'762',TZ:'834',TH:'764',
  TL:'626',TG:'768',TT:'780',TN:'788',TR:'792',TM:'795',UG:'800',UA:'804',AE:'784',
  GB:'826',US:'840',UY:'858',UZ:'860',VE:'862',VN:'704',YE:'887',ZM:'894',ZW:'716',
  CD:'180',PS:'275',XK:'383',
}

// Resolve alpha-2 code to a human-readable name, falling back to the code itself
export function alpha2ToFullName(code: string): string {
  const numeric = ALPHA2_TO_NUMERIC[code]
  if (!numeric) return code
  return NUMERIC_TO_NAME[numeric] ?? code
}
