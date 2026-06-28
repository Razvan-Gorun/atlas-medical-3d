export function getAnatomicalColor(meshName, system) {
  const name = meshName.toLowerCase();

  // ═══════════════ OASE ═══════════════
  if (system === 'skeletal') {
    // Dinți
    if (name.includes('canine') || name.includes('incisor') || name.includes('premolar') || name.includes('molar') || name.includes('tooth'))
      return 0xfaf8f2;
    // Vertebre
    if (name.includes('vertebra') || name.includes('atlas') || name.includes('axis') || name.includes('sacrum') || name.includes('coccyx'))
      return 0xe8d5c4;
    // Stern, coaste
    if (name.includes('rib') || name.includes('sternum') || name.includes('manubrium') || name.includes('xiphoid'))
      return 0xf0decb;
    // Oase lungi
    if (name.includes('femur') || name.includes('tibia') || name.includes('humerus') || name.includes('radius'))
      return 0xf5e6d3;
    if (name.includes('fibula') || name.includes('ulna'))
      return 0xf1e2cf;
    // Mână/picior
    if (name.includes('metacarpal') || name.includes('metatarsal') || name.includes('phalanx'))
      return 0xd9d2c8;
    // Carpiene
    if (name.includes('capitate') || name.includes('hamate') || name.includes('scaphoid'))
      return 0xddd8cf;
    // Craniu
    if (name.includes('frontal') || name.includes('parietal') || name.includes('occipital'))
      return 0xe8d5c4;
    if (name.includes('temporal') || name.includes('sphenoid'))
      return 0xead7c6;
    if (name.includes('zygomatic') || name.includes('maxilla') || name.includes('mandible'))
      return 0xe9d5c4;
    // Cartilaje costale
    if (name.includes('costal_cartilage'))
      return 0xe0f2f1;
    return 0xf0e8e0;
  }

  // ═══════════════ MUȘCHI ═══════════════
  if (system === 'muscular') {
    // Tendoane, fascii, aponevroze
    if (name.includes('tendon') || name.includes('calcaneal')) return 0xf2f2f2;
    if (name.includes('aponeurosis') || name.includes('linea_alba')) return 0xffffff;
    if (name.includes('fascia') || name.includes('tract') || name.includes('retinaculum')) return 0xd9d9d9;
    // Cap/Gât
    if (name.includes('masseter') || name.includes('temporalis') || name.includes('frontalis')) return 0xbc5d58;
    if (name.includes('sternocleidomastoid')) return 0xab4e48;
    // Trunchi
    if (name.includes('pectoralis') || name.includes('rectus_abdominis')) return 0xa52a2a;
    if (name.includes('oblique') || name.includes('transversus') || name.includes('serratus')) return 0xb22222;
    // Spate
    if (name.includes('trapezius') || name.includes('latissimus')) return 0x8b0000;
    if (name.includes('erector_spinae') || name.includes('rhomboid')) return 0x800000;
    // Membru superior
    if (name.includes('deltoid')) return 0xb22222;
    if (name.includes('biceps') || name.includes('brachialis')) return 0xcd5c5c;
    if (name.includes('triceps')) return 0xc4534d;
    // Membru inferior
    if (name.includes('gluteus')) return 0x8b4513;
    if (name.includes('quadriceps') || name.includes('vastus')) return 0x9c3e36;
    if (name.includes('gastrocnemius') || name.includes('soleus')) return 0x8e352e;
    return 0xb03a2e;
  }

  // ═══════════════ NERVI ═══════════════
  if (system === 'nervous') {
  // Glande
  if (name.includes('gland') || name.includes('hypophysis') || name.includes('pineal')) return 0x66BB6A;
  
  // Structuri nervoase ale ochiului (păstrate)
  if (name.includes('optic_nerve') || name.includes('optic_chiasm') || name.includes('optic_tract') || name.includes('retina')) return 0x8D6E63;
  
  // Ganglioni
  if (name.includes('ganglion') || name.includes('ganglia')) return 0x2196F3;
  
  // Nuclei
  if (name.includes('nucleus')) return 0x8E24AA;
  
  // Tracturi
  if (name.includes('tract') || name.includes('fasciculus') || name.includes('lemniscus') || name.includes('peduncle')) return 0xD32F2F;
  
  // Ventriculi
  if (name.includes('ventricle') || name.includes('aqueduct')) return 0x64B5F6;
  
  // Substanță albă
  if (name.includes('white_matter') || name.includes('corpus_callosum') || name.includes('fornix')) return 0xE0E0E0;
  
  // Creier
  if (name.includes('gyrus') || name.includes('lobe') || name.includes('cortex') || name.includes('sulcus')) return 0xF06292;
  
  // Plexuri
  if (name.includes('plexus')) return 0xFF8C00;
  
  // Ramuri
  if (name.includes('branch') || name.includes('division') || name.includes('root') || name.includes('cord') || name.includes('trunk')) return 0xFFF176;
  
  // Măduva spinării
  if (name.includes('spinal')) return 0xB71C1C;
  
  // Nervi
  if (name.includes('nerve')) return 0xFFD700;
  
  return 0xCCCCCC;
}

  // ═══════════════ ARTERE ═══════════════
  if (system === 'arterial') {
  // --- ARTERE PULMONARE (transportă sânge neoxigenat) ---
  if (name.includes('pulmonary_trunk')) return 0x7d3c98; // violet intens
  if (name.includes('pulmonary_artery')) return 0x8e44ad; // violet mediu

  // --- AORTA ---
  if (name.includes('ascending_aorta')) return 0xb71c1c; // roșu intens
  if (name.includes('aortic_arch')) return 0xc62828;
  if (name.includes('thoracic_aorta')) return 0xb71c1c;
  if (name.includes('abdominal_aorta')) return 0xa31515;

  // --- TRUNCHIURI PRINCIPALE ---
  if (name.includes('brachiocephalic_trunk')) return 0xd32f2f;
  if (name.includes('coeliac_trunk')) return 0xd32f2f;

  // --- ARTERE CAROTIDE ---
  if (name.includes('carotid')) return 0xc0392b;

  // --- ARTERE SUBCLAVICULARE ȘI ALE MEMBRULUI SUPERIOR ---
  if (name.includes('subclavian_artery')) return 0xc0392b;
  if (name.includes('axillary_artery')) return 0xd3544e;
  if (name.includes('brachial_artery')) return 0xe74c3c;
  if (name.includes('radial_artery')) return 0xec7063;
  if (name.includes('ulnar_artery')) return 0xec7063;

  // --- ARTERE ILIACE ȘI ALE MEMBRULUI INFERIOR ---
  if (name.includes('iliac_artery')) return 0xc0392b;
  if (name.includes('femoral_artery')) return 0xd3544e;
  if (name.includes('popliteal_artery')) return 0xe74c3c;
  if (name.includes('tibial_artery')) return 0xec7063;
  if (name.includes('fibular_artery')) return 0xec7063;

  // --- ARTERE VISCERALE ---
  if (name.includes('renal_artery')) return 0xd3544e;
  if (name.includes('mesenteric_artery')) return 0xe74c3c;
  if (name.includes('splenic_artery')) return 0xe74c3c;
  if (name.includes('hepatic_artery')) return 0xd3544e;
  if (name.includes('gastric_artery')) return 0xe74c3c;
  if (name.includes('colic_artery')) return 0xec7063;

  // --- ARTERE CORONARE ---
  if (name.includes('coronary_artery')) return 0xb71c1c;

  // --- ARTERE CEREBRALE ---
  if (name.includes('cerebral_artery')) return 0xe74c3c;
  if (name.includes('communicating_artery')) return 0xec7063;
  if (name.includes('cerebellar_artery')) return 0xec7063;
  if (name.includes('basilar_artery')) return 0xd3544e;

  // --- ARTERE VERTEBRALE ---
  if (name.includes('vertebral_artery')) return 0xc0392b;

  // --- ARTERE INTERCOSTALE ---
  if (name.includes('intercostal_artery')) return 0xec7063;

  // --- DEFAULT ARTERIAL ---
  if (name.includes('artery')) return 0xe74c3c; // roșu arterial standard

  return 0xe74c3c;
}

  // ═══════════════ VENE ═══════════════
  if (system === 'venous') {
  // --- VENE PULMONARE (transportă sânge oxigenat) ---
  if (name.includes('pulmonary_vein')) return 0xe67e22; // portocaliu

  // --- VENE CAVE ---
  if (name.includes('superior_vena_cava')) return 0x1a5276; // albastru închis
  if (name.includes('inferior_vena_cava')) return 0x154360; // și mai închis

  // --- VENE PORTE ---
  if (name.includes('portal_vein') || name.includes('hepatic_portal')) return 0x2e86c1; // albastru verzui

  // --- SINUSURI VENOASE ---
  if (name.includes('sinus')) return 0x1b4f72; // albastru intens

  // --- VENE SUPERFICIALE ---
  if (name.includes('cephalic_vein') || name.includes('basilic_vein')) return 0x5dade2; // albastru mediu
  if (name.includes('saphenous')) return 0x3498db; // albastru puțin mai intens
  if (name.includes('superficial_vein') || name.includes('superficial_venous')) return 0x85c1e9; // albastru deschis

  // --- VENE PROFUNDE ---
  if (name.includes('femoral_vein') || name.includes('popliteal_vein')) return 0x2874a6;
  if (name.includes('axillary_vein') || name.includes('subclavian_vein')) return 0x21618c;
  if (name.includes('jugular')) return 0x1b4f72;
  if (name.includes('brachial_vein') || name.includes('ulnar_vein') || name.includes('radial_vein')) return 0x2e86c1;
  if (name.includes('tibial_vein') || name.includes('fibular_vein')) return 0x2e86c1;

  // --- VENE VISCERALE ---
  if (name.includes('renal_vein')) return 0x2980b9;
  if (name.includes('mesenteric_vein')) return 0x3498db;
  if (name.includes('splenic_vein')) return 0x5dade2;
  if (name.includes('hepatic_vein')) return 0x1a5276;
  if (name.includes('gastric_vein') || name.includes('gastro')) return 0x3498db;
  if (name.includes('colic_vein')) return 0x5dade2;

  // --- ALTE VENE SPECIFICE ---
  if (name.includes('azygos_vein') || name.includes('hemi-azygos')) return 0x1a5276;
  if (name.includes('vertebral_vein')) return 0x2980b9;
  if (name.includes('iliac_vein')) return 0x1f618d;

  // --- DEFAULT VENOS ---
  if (name.includes('vein')) return 0x2980b9; // albastru standard

  return 0x2980b9; // albastru venos generic
}
  if (system === 'visceral') {
  // --- OCHI ȘI ANEXE ---
  if (name.includes('cornea')) return 0xd4e6f1; // cornee – albastru pal
  if (name.includes('iris')) return 0x8b5a2b; // iris – maro
  if (name.includes('lens')) return 0xfcf3e0; // cristalin – gălbui deschis
  if (name.includes('retina')) return 0xf39c12; // retina – portocaliu (țesut nervos)
  if (name.includes('sclera')) return 0xf8f9f9; // scleră – alb
  if (name.includes('vitreous')) return 0xe0f0ff; // corp vitros – albastru foarte pal
  if (name.includes('lacrimal_gland')) return 0xe8b4b4; // glandă lacrimală – roz pal

  // --- INIMĂ ȘI PERICARD ---
  if (name.includes('heart') || name.includes('myocardium')) return 0xb03a2e;
  if (name.includes('atrium') && name.includes('left')) return 0xc0392b;
  if (name.includes('atrium') && name.includes('right')) return 0xa93226;
  if (name.includes('ventricle') && name.includes('left')) return 0xd3544e;
  if (name.includes('ventricle') && name.includes('right')) return 0xb5473f;
  if (name.includes('septum') && name.includes('heart')) return 0x922b21;
  if (name.includes('valve') || name.includes('leaflet')) return 0xf5cba7;
  if (name.includes('coronary_sulcus')) return 0xf9e79f;
  if (name.includes('pericardium')) return 0xd5dbdb;

  // --- PLĂMÂNI ȘI PLEURĂ ---
  if (name.includes('pleura')) return 0x9ec0e0;
  if (name.includes('lung') || name.includes('pulmonary')) return 0xd3a4a4;
  if (name.includes('bronch') || name.includes('trachea') || name.includes('carina')) return 0xc89696;

  // --- TUB DIGESTIV ---
  if (name.includes('stomach')) return 0xdaa06d;
  if (name.includes('duodenum')) return 0xe8b87a;
  if (name.includes('jejunum')) return 0xf0c78e;
  if (name.includes('ileum')) return 0xf5d0a0;
  if (name.includes('cecum')) return 0xe6b87a;
  if (name.includes('appendix') || name.includes('vermiform')) return 0xd9a86a;
  if (name.includes('colon') && name.includes('ascending')) return 0xe8c17e;
  if (name.includes('colon') && name.includes('transverse')) return 0xe6ba7e;
  if (name.includes('colon') && name.includes('descending')) return 0xe4b27a;
  if (name.includes('colon') && name.includes('sigmoid')) return 0xe0a870;
  if (name.includes('rectum')) return 0xd9a060;
  if (name.includes('anus') || name.includes('anal')) return 0xc88a5a;

  // --- FICAT, BILIARE ---
  if (name.includes('liver')) return 0x8b3a3a;
  if (name.includes('gallbladder') || name.includes('gall_bladder')) return 0x7d9e3a;
  if (name.includes('bile_duct') || name.includes('biliary') || name.includes('choledoch')) return 0x88b04b;
  if (name.includes('hepatic_duct')) return 0x9acd32;

  // --- SPLINĂ, PANCREAS ---
  if (name.includes('spleen')) return 0x8b4789;
  if (name.includes('pancreas')) return 0xe8c39e;

  // --- RINICHI, CĂI URINARE ---
  if (name.includes('kidney')) return 0xc49a6c;
  if (name.includes('renal_artery')) return 0xe74c3c;
  if (name.includes('renal_vein')) return 0x2980b9;
  if (name.includes('ureter')) return 0xd5b98a;
  if (name.includes('bladder') || name.includes('urinary')) return 0xd5b98a;
  if (name.includes('urethra')) return 0xc9a97a;

  // --- GLANDE ---
  if (name.includes('thyroid')) return 0xc95a5a;
  if (name.includes('parathyroid')) return 0xd9b382;
  if (name.includes('suprarenal') || name.includes('adrenal')) return 0xd4a76a;

  // --- ORGANE GENITALE ---
  if (name.includes('testis') || name.includes('testicle')) return 0xf0dbb0;
  if (name.includes('epididymis')) return 0xe6cfa0;
  if (name.includes('ductus_deferens') || name.includes('vas_deferens')) return 0xdcc898;
  if (name.includes('prostate')) return 0xd5b58a;
  if (name.includes('penis') || name.includes('corpus_cavernosum') || name.includes('corpus_spongiosum')) return 0xe0cba0;
  if (name.includes('glans')) return 0xdaa07a;
  if (name.includes('seminal_gland') || name.includes('seminal_vesicle')) return 0xe6cfa0;

  // --- ALTE ORGANE ---
  if (name.includes('tongue')) return 0xd15b5b;
  if (name.includes('pharynx') || name.includes('larynx') || name.includes('epiglottis')) return 0xd98880;
  if (name.includes('esophagus') || name.includes('oesophagus')) return 0xd7997a;
  if (name.includes('diaphragm')) return 0xbd7a6a;

  // --- VASE MARI ---
  if (name.includes('aorta')) return 0xe74c3c;
  if (name.includes('vena_cava')) return 0x2980b9;

  // --- DEFAULT VISCERAL ---
  return 0xd35400;
}
  // ═══════════════ ARTICULAȚII ═══════════════
  if (system === 'joints') {
  // --- MENISCURI ---
  if (name.includes('meniscus')) return 0xd4dce6; // gri-albastru pal

  // --- LABRUMURI (buză articulară) ---
  if (name.includes('labrum')) return 0xcfd8e2;

  // --- DISCI INTERVERTEBRALE ---
  if (name.includes('intervertebral_disc')) return 0xe0cda6; // galben-maro pal
  if (name.includes('nucleus_pulposus')) return 0xf5e6cc; // nucleu gelatinos, mai deschis

  // --- CARTILAJE ARTICULARE ---
  if (name.includes('cartilage')) return 0xd4dce6; // gri-albastru (cartilaj hialin)
  if (name.includes('costal_cartilage')) return 0xe0f2f1; // albăstrui semi-transparent

  // --- LIGAMENTE ---
  if (name.includes('ligament')) return 0xe6d98a; // galben pal

  // --- MEMBRANE INTEROSOASE ---
  if (name.includes('interosseous_membrane')) return 0xc8d0d8;

  // --- CAPSULE ARTICULARE ---
  if (name.includes('capsule')) return 0xf0e6d2; // bej pal

  // --- BURSE SINOVIALE ---
  if (name.includes('bursa')) return 0xe8c4a0; // roz-portocaliu pal

  // --- TEACA SINOVIALĂ ---
  if (name.includes('sheath') && (name.includes('tendon') || name.includes('synovial'))) return 0xe6d0b0;
  if (name.includes('synovial')) return 0xe6d0b0;

  // --- DISC ARTICULAR (altele) ---
  if (name.includes('disc') || name.includes('disk')) return 0xe0cda6;

  // --- OBTURATOR / ALTE MEMBRANE ---
  if (name.includes('obturator_membrane')) return 0xc8d0d8;

  // --- SIMFIZE ---
  if (name.includes('symphysis')) return 0xe0d5c0;

  // --- DEFAULT ARTICULAȚII ---
  return 0xbbc3c7; // gri neutru
}

  // ═══════════════ PIELE ═══════════════
  if (system === 'integumentary') {
  // --- PĂR ---
  if (name.includes('hair') && name.includes('head')) return 0x4a3728; // brunet închis
  if (name.includes('hair') && name.includes('pubic')) return 0x3b2a1e;
  if (name.includes('eyebrow')) return 0x5c4736;
  if (name.includes('eyelash')) return 0x332211;

  // --- UNGHII ---
  if (name.includes('nail')) return 0xf5f0e6; // alb sidefat
  if (name.includes('perionyx')) return 0xede5d8;

  // --- BUZE ȘI MUCOASE ---
  if (name.includes('lip') || name.includes('labial')) return 0xd98c7a; // roz-roșiatic
  if (name.includes('commissure')) return 0xcc7a6a;

  // --- PLEOAPE ---
  if (name.includes('eyelid')) return 0xe8c4a8; // subțire, ușor rozalie

  // --- MAMELOANE / AREOLE ---
  if (name.includes('mammary') || name.includes('nipple') || name.includes('areola')) return 0xcc9e8c;

  // --- OMBILIC ---
  if (name.includes('umbilic')) return 0xebc5ab;

  // --- REGIUNI SPECIALE (față, palme, tălpi) ---
  if (name.includes('face') || name.includes('facial')) return 0xf8d5b8;
  if (name.includes('palm')) return 0xf5caa5; // mai deschis
  if (name.includes('sole') || name.includes('plantar')) return 0xf0c8a0;

  // --- PIELIȚĂ (prepuț) ---
  if (name.includes('prepuce') || name.includes('foreskin')) return 0xebbfa5;

  // --- PIELE GENERALĂ ---
  if (name.includes('skin') || name.includes('integument') || name.includes('dermis') || name.includes('epidermis'))
    return 0xf5cba7; // piersică
  if (name.includes('superficial') && name.includes('fascia')) return 0xe8c8b0;

  // --- SÂN (țesut adipos subcutanat) ---
  if (name.includes('breast')) return 0xf5d5be;

  // --- REGIUNI ANATOMICE GENERALE (față, torace, etc.) ---
  return 0xf5cba7; // piersică – default piele
}

  // ═══════════════ FALLBACK ═══════════════
  return 0x95a5a6; // gri neutru
}